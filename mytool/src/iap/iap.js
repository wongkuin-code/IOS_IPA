// ── IAP helpers: ¥1 one-time unlock of premium dramas (non-consumable) ──
// Sandbox testing uses simulated payments, no real charge.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VIP_PRODUCT_ID = 'vip.unlock.all';
const STORAGE_KEY = 'eva_reel_vip_unlocked';
const VERIFY_API = 'https://api.haoweimedia.cn/api/verify-iap';

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
    return { ok: false, error: 'Missing transaction receipt (JWS)' };
  }
  let res;
  try {
    res = await fetch(VERIFY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jws, platform: 'ios' }),
    });
  } catch (e) {
    return { ok: false, networkError: true, error: `Network error: ${e && e.message}` };
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    return { ok: false, error: `Unexpected server response [${res.status}]` };
  }
  if (!res.ok || !data.ok) {
    const code = data && data.error;
    const detail = data && data.detail ? ` (${data.detail})` : '';
    return { ok: false, error: `${code || `Verification failed`}${detail} [${res.status}]` };
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
  if (!e) return 'Unknown error (no details)';
  if (typeof e === 'string') return e;
  const parts = [];
  if (e.code !== undefined && e.code !== null) parts.push(`Code: ${e.code}`);
  if (e.message) parts.push(`Message: ${e.message}`);
  if (e.userErrorMessage) parts.push(`Details: ${e.userErrorMessage}`);
  if (e.nativeErrorMessage) parts.push(`Native: ${e.nativeErrorMessage}`);
  if (!parts.length) parts.push(String(e));
  return parts.join('\n');
}
