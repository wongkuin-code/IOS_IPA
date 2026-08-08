// IAP 封装：¥1 一次性解锁全部精品书库（非消耗型）
// 沙盒测试使用模拟支付，不会产生真实扣费
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VIP_PRODUCT_ID = 'vip.unlock.all';
const STORAGE_KEY = 'eva_reel_vip_unlocked';

export async function loadUnlockState(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch (e) {
    return false;
  }
}

export async function saveUnlockState(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch (e) {
    // ignore
  }
}

export function isVipPurchase(purchase): boolean {
  return purchase && purchase.productId === VIP_PRODUCT_ID;
}
