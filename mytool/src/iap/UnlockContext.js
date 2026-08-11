// ── Unlock context: global VIP state + purchase flow ──
// Uses the expo-iap ROOT API via lazy require so Expo Go / Web (no native
// module) can still render the UI in preview mode.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
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
  console.warn('[IAP] expo-iap 原生模块不可用（Expo Go / Web 预览模式）:', e && e.message);
  iap = null;
}

const UnlockContext = createContext(null);

export function UnlockProvider({ children }) {
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
      console.log('[IAP] 购买成功', JSON.stringify(purchase && {
        productId: purchase.productId,
        purchaseState: purchase.purchaseState,
        transactionDate: purchase.transactionDate,
        originalTransactionDate: purchase.originalTransactionDate,
      }));
      if (!isVipPurchase(purchase)) {
        console.warn('[IAP] 商品ID不匹配:', purchase && purchase.productId, '期望:', VIP_PRODUCT_ID);
        setPaywallBusy(false);
        setUnlockError('商品ID不匹配，后台配置的 ID 与代码不一致');
        return;
      }
      setPaywallBusy(true);
      const result = await verifyOnServer(purchase);
      if (result.ok) {
        await iap.finishTransaction({ purchase, isConsumable: false });
        await saveUnlockState();
        setUnlocked(true);
        setPaywallVisible(false);
        setPaywallBusy(false);
        Alert.alert('解锁成功', '全部精品短剧已解锁');
      } else {
        setPaywallBusy(false);
        console.warn('[IAP] 服务器验证失败:', result);
        setUnlockError(`服务器未确认这笔交易，暂未解锁。\n${result.error}\n交易已保留，可稍后重启 App 自动重试。`);
      }
    }));
    subs.push(iap.purchaseErrorListener((error) => {
      setPaywallBusy(false);
      console.warn('[IAP] 购买失败(回调):', error);
      if (error.code !== iap.ErrorCode.UserCancelled) {
        setUnlockError(fmtIapError(error));
      }
    }));
    } catch (e) {
      console.warn('[IAP] expo-iap 原生模块不可用（Expo Go / Web 预览模式）:', e && e.message);
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
      console.warn('[IAP] expo-iap 原生模块不可用（Expo Go / Web 预览模式）:', e && e.message);
      iap = null;
      setUnlocked(true);
      return;
    }
    connectionPromise
      .then(() => {
        if (alive) {
          console.log('[IAP] 商店连接成功');
          setConnected(true);
        }
      })
      .catch((e) => {
        console.warn('[IAP] initConnection 失败:', e);
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
    iap.fetchProducts({ skus: [VIP_PRODUCT_ID], type: 'in-app' })
      .then((list) => {
        const p = (list || []).find((x) => x.id === VIP_PRODUCT_ID);
        setVipPrice((p && p.displayPrice) || '¥1');
      })
      .catch((e) => console.warn('[IAP] 商品查询失败:', e));
    iap.getAvailablePurchases()
      .then((purchases) => {
        console.log(`[IAP] 已有购买记录: ${purchases.length} 个`, purchases.map((p) => p.productId));
        const vip = purchases.filter(isVipPurchase);
        if (!vip.length) return;
        Promise.all(vip.map((p) => verifyOnServer(p).catch((e) => ({ ok: false, networkError: true, error: String(e) }))))
          .then((results) => {
            if (results.some((r) => r.ok)) {
              console.log('[IAP] 服务器验证通过，恢复解锁');
              saveUnlockState();
              setUnlocked(true);
            } else if (results.every((r) => r.networkError)) {
              console.warn('[IAP] 服务器不可达，暂不恢复解锁');
            } else {
              console.warn('[IAP] 服务器验证未通过:', results);
            }
          });
      })
      .catch((e) => console.warn('[IAP] 查询已有购买记录失败:', e));
  }, [connected]);

  const buyVip = useCallback(async () => {
    if (!iap) {
      Alert.alert('预览模式', '当前是预览模式（Expo Go / Web），无法购买。\n请在 TestFlight / 正式包中购买。');
      return;
    }
    if (!connected) {
      setUnlockError('暂时无法连接 App Store（StoreKit 未连接）\n常见原因：付费协议未生效 / 审核中 / 用 Expo Go 测试');
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
    } catch (e) {
      setPaywallBusy(false);
      console.warn('[IAP] requestPurchase 抛错:', e);
      setUnlockError(fmtIapError(e));
    }
  }, [connected]);

  const restoreVip = useCallback(async () => {
    if (!iap) {
      Alert.alert('预览模式', '当前是预览模式（Expo Go / Web），无购买记录可恢复。');
      return;
    }
    setPaywallBusy(true);
    setUnlockError(null);
    try {
      await iap.restorePurchases();
      const purchases = await iap.getAvailablePurchases();
      console.log('[IAP] 恢复购买完成:', purchases.map((p) => p.productId));
      const vip = purchases.filter(isVipPurchase);
      if (!vip.length) {
        Alert.alert('无购买记录', '未找到可恢复的购买记录');
        return;
      }
      const results = await Promise.all(vip.map((p) => verifyOnServer(p).catch((e) => ({ ok: false, networkError: true, error: String(e) }))));
      if (results.some((r) => r.ok)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallVisible(false);
        Alert.alert('已恢复', '购买记录已恢复，精品短剧已解锁');
      } else {
        const first = results[0];
        Alert.alert('恢复失败', `服务器未确认购买记录。\n${first && first.error}`);
      }
    } catch (e) {
      console.warn('[IAP] 恢复购买失败:', e);
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
