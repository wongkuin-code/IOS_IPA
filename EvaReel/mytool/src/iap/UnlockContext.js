// ── Unlock context: global VIP state + purchase flow ──
// Uses the expo-iap ROOT API via lazy require so Expo Go / Web (no native
// module) can still render the UI in preview mode.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import {
  VIP_PRODUCT_ID,
  loadUnlockState,
  saveUnlockState,
  isVipPurchase,
  verifyOnServer,
  fmtIapError,
} from './iap';

let iap = null;
try {
  iap = require('expo-iap');
} catch (e) {
  console.warn('[IAP] expo-iap native module unavailable (Expo Go / Web preview mode):', e && e.message);
  iap = null;
}

// 购买看门狗：requestPurchase 返回后若长时间收不到商店回调（常见于存在未完成交易），
// 主动复位忙碌态并给出提示，避免无限转圈。
let buyWatchdog = null;
function clearBuyWatchdog() {
  if (buyWatchdog) {
    clearTimeout(buyWatchdog);
    buyWatchdog = null;
  }
}

const UnlockContext = createContext(null);

export function UnlockProvider({ children }) {
  // Web 预览：不接 IAP，直接视为已解锁，付费墙永不弹出、购买/恢复仅提示。
  if (Platform.OS === 'web') {
    const webValue = {
      unlocked: true,
      paywallVisible: false,
      setPaywallVisible: () => {},
      paywallBusy: false,
      vipPrice: '¥1',
      unlockError: null,
      setUnlockError: () => {},
      buyVip: () => Alert.alert('Web 预览', 'Web 端无需购买，已直接解锁。'),
      restoreVip: () => Alert.alert('Web 预览', 'Web 端无需购买，已直接解锁。'),
      previewMode: true,
    };
    return <UnlockContext.Provider value={webValue}>{children}</UnlockContext.Provider>;
  }

  const [unlocked, setUnlocked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallBusy, setPaywallBusy] = useState(false);
  const [vipPrice, setVipPrice] = useState('¥1');
  const [unlockError, setUnlockError] = useState(null);
  const previewMode = !iap;

  // Purchase result/error listeners (root API, event-based)
  useEffect(() => {
    if (!iap) {
      setUnlocked(true);
      return;
    }
    const subs = [];
    try {
      subs.push(iap.purchaseUpdatedListener(async (purchase) => {
      console.log('[IAP] purchase success', JSON.stringify(purchase && {
        productId: purchase.productId,
        purchaseState: purchase.purchaseState,
        transactionDate: purchase.transactionDate,
        originalTransactionDate: purchase.originalTransactionDate,
      }));
      if (!isVipPurchase(purchase)) {
        console.warn('[IAP] product ID mismatch:', purchase && purchase.productId, 'expected:', VIP_PRODUCT_ID);
        setPaywallBusy(false);
        setUnlockError('Product ID mismatch: the ID configured in App Store Connect differs from the code');
        return;
      }
      clearBuyWatchdog();
      setPaywallBusy(true);
      const result = await verifyOnServer(purchase);
      if (result.ok) {
        await iap.finishTransaction({ purchase, isConsumable: false });
        await saveUnlockState();
        setUnlocked(true);
        setPaywallVisible(false);
        setPaywallBusy(false);
        Alert.alert('Unlocked', 'All premium dramas are now unlocked');
      } else {
        setPaywallBusy(false);
        console.warn('[IAP] server verification failed:', result);
        setUnlockError(`The server could not confirm this transaction, so it was not unlocked.\n${result.error}\nThe transaction is preserved — restart the app later to retry automatically.`);
      }
    }));
    subs.push(iap.purchaseErrorListener((error) => {
      clearBuyWatchdog();
      setPaywallBusy(false);
      console.warn('[IAP] purchase failed (callback):', error);
      if (error.code !== iap.ErrorCode.UserCancelled) {
        setUnlockError(fmtIapError(error));
      }
    }));
    } catch (e) {
      console.warn('[IAP] expo-iap native module unavailable (Expo Go / Web preview mode):', e && e.message);
      iap = null;
      setUnlocked(true);
      return;
    }
    return () => subs.forEach((s) => s.remove());
  }, []);

  // StoreKit connection
  useEffect(() => {
    if (!iap) return;
    let alive = true;
    let connectionPromise;
    try {
      connectionPromise = iap.initConnection();
    } catch (e) {
      console.warn('[IAP] expo-iap native module unavailable (Expo Go / Web preview mode):', e && e.message);
      iap = null;
      setUnlocked(true);
      return;
    }
    connectionPromise
      .then(() => {
        if (alive) {
          console.log('[IAP] store connected');
          setConnected(true);
        }
      })
      .catch((e) => {
        console.warn('[IAP] initConnection failed:', e);
        if (alive) setUnlockError(fmtIapError(e));
      });
    return () => {
      alive = false;
      try {
        iap.endConnection && iap.endConnection();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    loadUnlockState().then(setUnlocked);
  }, []);

  // Fetch products + restore purchases on connect
  useEffect(() => {
    if (!iap || !connected) return;
    try {
      iap.fetchProducts({ skus: [VIP_PRODUCT_ID], type: 'in-app' })
        .then((list) => {
          const p = (list || []).find((x) => x.id === VIP_PRODUCT_ID);
          setVipPrice((p && p.displayPrice) || '¥1');
        })
        .catch((e) => console.warn('[IAP] product fetch failed:', e));
    } catch (e) {
      console.warn('[IAP] product fetch threw synchronously:', e);
    }
    try {
      iap.getAvailablePurchases()
        .then((purchases) => {
          console.log(`[IAP] existing purchases: ${purchases.length}`, purchases.map((p) => p.productId));
          const vip = purchases.filter(isVipPurchase);
          if (!vip.length) return;
          Promise.all(vip.map((p) => verifyOnServer(p).catch((e) => ({ ok: false, networkError: true, error: String(e) }))))
            .then((results) => {
              if (results.some((r) => r.ok)) {
                console.log('[IAP] server verified, restoring unlock');
                saveUnlockState();
                setUnlocked(true);
              } else if (results.every((r) => r.networkError)) {
                console.warn('[IAP] server unreachable, not restoring unlock');
              } else {
                console.warn('[IAP] server verification failed:', results);
              }
            });
        })
        .catch((e) => console.warn('[IAP] failed to query existing purchases:', e));
    } catch (e) {
      console.warn('[IAP] existing purchase query threw synchronously:', e);
    }
  }, [connected]);

  const buyVip = useCallback(async () => {
    if (!iap) {
      Alert.alert('Preview Mode', 'Purchases are unavailable in preview mode (Expo Go / Web).\nPlease purchase in the TestFlight or production build.');
      return;
    }
    if (!connected) {
      setUnlockError('Unable to connect to the App Store (StoreKit not connected)\nCommon causes: paid app agreement not accepted / build under review / testing in Expo Go');
      return;
    }
    setPaywallBusy(true);
    setUnlockError(null);
    try {
      await iap.requestPurchase({
        request: {
          apple: { sku: VIP_PRODUCT_ID },
          google: { skus: [VIP_PRODUCT_ID] },
        },
        type: 'in-app',
      });
      // requestPurchase 只负责发起，结果靠 listener 回调。若 25s 内无任何回调
      // （常见于存在未完成交易时再购买），主动复位，避免无限转圈。
      clearBuyWatchdog();
      buyWatchdog = setTimeout(() => {
        buyWatchdog = null;
        setPaywallBusy(false);
        setUnlockError('The store returned no result (there may be an unfinished transaction).\nIf you were already charged, restarting the app will auto-restore the unlock; or try again later.');
      }, 25000);
    } catch (e) {
      clearBuyWatchdog();
      setPaywallBusy(false);
      console.warn('[IAP] requestPurchase threw:', e);
      setUnlockError(fmtIapError(e));
    }
  }, [connected]);

  const restoreVip = useCallback(async () => {
    if (!iap) {
      Alert.alert('Preview Mode', 'No purchases can be restored in preview mode (Expo Go / Web).');
      return;
    }
    setPaywallBusy(true);
    setUnlockError(null);
    try {
      await iap.restorePurchases();
      const purchases = await iap.getAvailablePurchases();
      console.log('[IAP] restore purchases done:', purchases.map((p) => p.productId));
      const vip = purchases.filter(isVipPurchase);
      if (!vip.length) {
        Alert.alert('No Purchases', 'No restorable purchase was found');
        return;
      }
      const results = await Promise.all(vip.map((p) => verifyOnServer(p).catch((e) => ({ ok: false, networkError: true, error: String(e) }))));
      if (results.some((r) => r.ok)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallVisible(false);
        Alert.alert('Restored', 'Your purchase was restored — premium dramas are unlocked');
      } else {
        const first = results[0];
        Alert.alert('Restore Failed', `The server could not confirm the purchase.\n${first && first.error}`);
      }
    } catch (e) {
      console.warn('[IAP] restore purchases failed:', e);
      setUnlockError(fmtIapError(e));
    } finally {
      setPaywallBusy(false);
    }
  }, []);

  const value = {
    unlocked,
    paywallVisible,
    setPaywallVisible,
    paywallBusy,
    vipPrice,
    unlockError,
    setUnlockError,
    buyVip,
    restoreVip,
    previewMode,
  };

  return <UnlockContext.Provider value={value}>{children}</UnlockContext.Provider>;
}

export function useUnlock() {
  return useContext(UnlockContext);
}
