// ── Paywall modal: ¥1 unlock all premium dramas ──
import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';

export default function PaywallModal() {
  const { colors, fonts } = useTheme();
  const { paywallVisible, setPaywallVisible, setUnlockError, paywallBusy, vipPrice, unlockError, buyVip, restoreVip } = useUnlock();
  useEffect(() => {
    if (paywallVisible) setUnlockError(null);
  }, [paywallVisible, setUnlockError]);
  if (!paywallVisible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setPaywallVisible(false)}>
      <View style={styles.mask}>
        <LinearGradient colors={[colors.surface, colors.background]} style={[styles.card, { borderColor: colors.borderGold }]}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={[styles.title, fonts.display, { color: colors.text }]}>Unlock Premium Dramas</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            All trending & new releases{'\n'}One-time purchase, lifetime access
          </Text>
          {unlockError ? <Text style={styles.error}>{unlockError}</Text> : null}
          <TouchableOpacity
            disabled={paywallBusy}
            onPress={buyVip}
            style={[styles.buyBtn, { backgroundColor: colors.gold, borderRadius: 999 }, paywallBusy && styles.disabled]}
          >
            {paywallBusy ? (
              <ActivityIndicator color="#200B06" />
            ) : (
              <Text style={styles.buyText}>{vipPrice} Unlock All</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity disabled={paywallBusy} onPress={restoreVip} style={styles.restoreBtn}>
            <Text style={[styles.restoreText, { color: colors.textMuted }]}>
              {paywallBusy ? 'Processing…' : 'Restore Purchase'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaywallVisible(false)} hitSlop={8}>
            <Text style={[styles.close, { color: colors.textMuted }]}>Not Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  icon: { fontSize: 34, marginBottom: 10 },
  title: { fontSize: 24, textAlign: 'center' },
  desc: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  error: { fontSize: 12, color: '#E8A08B', textAlign: 'center', marginTop: 10, lineHeight: 17 },
  buyBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, marginTop: 18 },
  buyText: { color: '#200B06', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  restoreBtn: { marginTop: 14, paddingVertical: 6 },
  restoreText: { fontSize: 14, fontWeight: '600' },
  close: { marginTop: 12, fontSize: 13 },
});
