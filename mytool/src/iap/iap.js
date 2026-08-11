// ── IAP helpers: ¥1 one-time unlock of premium dramas (non-consumable) ──
// Sandbox testing uses simulated payments, no real charge.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VIP_PRODUCT_ID = 'vip.unlock.all';
const STORAGE_KEY = 'eva_reel_vip_unlocked';
// TODO: replace with your real verification-server domain (HTTPS)
const VERIFY_API = 'https://YOUR-DOMAIN.com/api/verify-iap';

export async function loadUnlockState() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch (e) {
    return false;
  }
}

export async function saveUnlockState() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch (e) {
    // ignore
  }
}

export function isVipPurchase(purchase) {
  return purchase && purchase.productId === VIP_PRODUCT_ID;
}

// Send the transaction JWS to the server for verification (iOS StoreKit 2).
// Returns { ok: true, productId, transactionId, alreadyGranted }
//         { ok: false, error, networkError?: true }
export async function verifyOnServer(purchase) {
  const jws = purchase && (purchase.purchaseToken || purchase.transactionJws);
  if (!jws) {
    return { ok: false, error: '缺少交易凭证(JWS)' };
  }
  let res;
  try {
    res = await fetch(VERIFY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jws, platform: 'ios' }),
    });
  } catch (e) {
    return { ok: false, networkError: true, error: `网络错误: ${e && e.message}` };
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    return { ok: false, error: `服务器响应异常 [${res.status}]` };
  }
  if (!res.ok || !data.ok) {
    return { ok: false, error: (data && data.error) || `验证失败 [${res.status}]` };
  }
  return {
    ok: true,
    productId: data.productId,
    transactionId: data.transactionId,
    alreadyGranted: Boolean(data.alreadyGranted),
  };
}

// ── Error formatting for Alert dialogs ──
export function fmtIapError(e) {
  if (!e) return '未知错误（无详细信息）';
  if (typeof e === 'string') return e;
  const parts = [];
  if (e.code !== undefined && e.code !== null) parts.push(`错误码: ${e.code}`);
  if (e.message) parts.push(`消息: ${e.message}`);
  if (e.userErrorMessage) parts.push(`详情: ${e.userErrorMessage}`);
  if (e.nativeErrorMessage) parts.push(`原生: ${e.nativeErrorMessage}`);
  if (!parts.length) parts.push(String(e));
  return parts.join('\n');
}
