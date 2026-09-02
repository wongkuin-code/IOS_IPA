// ── Unlock context: global VIP state + purchase flow ──
// Uses the expo-iap ROOT API via lazy require so Expo Go / Web (no native
// module) can still render the UI in preview mode.
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

// Purchase watchdog: after requestPurchase returns, if no store callback
// arrives for a long time (common when an unfinished transaction exists),
// proactively reset the busy state and show a hint to avoid an endless spinner.
let buyWatchdog = null;
function clearBuyWatchdog() {
  if (buyWatchdog) {
    clearTimeout(buyWatchdog);
    buyWatchdog = null;
  }
}

const UnlockContext = createContext(null);

export function UnlockProvider({ children }) {
  // Web preview: no IAP; treat as already unlocked, the paywall never shows,
  // and buy/restore only display a hint.
  if (Platform.OS === 'web') {
    const webValue = {
      unlocked: true,
      paywallVisible: false,
      setPaywallVisible: () => {},
      paywallBusy: false,
      vipPrice: '¥1',
      unlockError: null,
      setUnlockError: () => {},
      buyVip: () => Alert.alert('Web Preview', 'No purchase needed on Web — already unlocked.'),
      restoreVip: () => Alert.alert('Web Preview', 'No purchase needed on Web — already unlocked.'),
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

  // StoreKit re-delivers unfinished transactions on every launch through
  // purchaseUpdatedListener. Only accept a purchase when the user explicitly
  // started buy/restore in this session — otherwise an old sandbox transaction
  // left over from an earlier review round would silently unlock VIP with no
  // purchase flow (Apple guideline 2.1(b)).
  const awaitingUserAction = useRef(false);

  // Purchase result/error listeners (root API, event-based)
  useEffect(() => {
    if (!iap) return;
    const subs = [];
    try {
      subs.push(iap.purchaseUpdatedListener(async (purchase) => {
      console.log('[IAP] purchase success', JSON.stringify(purchase && {
        productId: purchase.productId,
        purchaseState: purchase.purchaseState,
        transactionDate: purchase.transactionDate,
        originalTransactionDate: purchase.originalTransactionDate,
      }));
      // Ignore transactions StoreKit replays at launch / in the background:
      // VIP may only be granted for a purchase the user initiated here.
      if (!awaitingUserAction.current) {
        console.warn('[IAP] ignoring store-delivered transaction (no user-initiated buy/restore this session):', purchase && purchase.productId);
        return;
      }
      awaitingUserAction.current = false;
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
        Alert.alert('Unlocked', 'All premium videos are now unlocked');
      } else {
        setPaywallBusy(false);
        console.warn('[IAP] server verification failed:', result);
        setUnlockError(`The server could not confirm this transaction, so it was not unlocked.\n${result.error}\nThe transaction is preserved — restart the app later to retry automatically.`);
      }
    }));
    subs.push(iap.purchaseErrorListener((error) => {
      clearBuyWatchdog();
      awaitingUserAction.current = false;
      setPaywallBusy(false);
      console.warn('[IAP] purchase failed (callback):', error);
      if (error.code !== iap.ErrorCode.UserCancelled) {
        setUnlockError(fmtIapError(error));
      }
    }));
    } catch (e) {
      console.warn('[IAP] failed to register purchase listeners:', e && e.message);
      // Fail closed: stay locked. Never grant VIP because the store is broken.
      setUnlockError(fmtIapError(e));
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
      console.warn('[IAP] initConnection threw:', e && e.message);
      // Fail closed: stay locked when the store cannot be reached.
      setUnlockError(fmtIapError(e));
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

  // Fetch product price on connect. Restoring is intentionally NOT done here:
  // an automatic restore at launch can re-grant a sandbox purchase left over
  // from a previous review, which looks like "VIP unlocked with no purchase".
  // Restoring is only performed when the user taps Restore Purchase.
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
    awaitingUserAction.current = true;
    try {
      await iap.requestPurchase({
        request: {
          apple: { sku: VIP_PRODUCT_ID },
          google: { skus: [VIP_PRODUCT_ID] },
        },
        type: 'in-app',
      });
      // requestPurchase only initiates; the result comes via the listener
      // callback. If no callback arrives within 25s (common when an unfinished
      // transaction exists), proactively reset to avoid an endless spinner.
      clearBuyWatchdog();
      buyWatchdog = setTimeout(() => {
        buyWatchdog = null;
        setPaywallBusy(false);
        setUnlockError('The store returned no result (there may be an unfinished transaction).\nIf you were already charged, tap Restore Purchase in Profile to restore the unlock; or try again later.');
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
    awaitingUserAction.current = true;
    try {
      await iap.restorePurchases();
      const purchases = await iap.getAvailablePurchases();
      console.log('[IAP] restore purchases done:', purchases.map((p) => p.productId));
      const vip = purchases.filter(isVipPurchase);
      if (!vip.length) {
        Alert.alert('No Purchases', 'No restorable purchase was found');
        return;
      }
      const results = await Promise.all(vip.map(async (p) => {
        const r = await verifyOnServer(p).catch((e) => ({ ok: false, networkError: true, error: String(e) }));
        if (r.ok) {
          // Close the loop: a finished transaction is no longer replayed by
          // StoreKit on every launch.
          try {
            await iap.finishTransaction({ purchase: p, isConsumable: false });
          } catch (e) {
            console.warn('[IAP] finishTransaction failed during restore:', e);
          }
        }
        return r;
      }));
      if (results.some((r) => r.ok)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallVisible(false);
        Alert.alert('Restored', 'Your purchase was restored — premium videos are unlocked');
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
