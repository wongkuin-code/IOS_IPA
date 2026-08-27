// ── Profile: avatar, stats, VIP row, settings list ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import ComingSoon from '../components/ComingSoon';
import { loadSaved, loadHistory } from '../data/libraryStore';

export default function ProfileScreen() {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { unlocked, setPaywallVisible, restoreVip, vipPrice } = useUnlock();
  const [savedCount, setSavedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSaved().then((l) => setSavedCount(l.length));
    loadHistory().then((l) => setHistoryCount(l.length));
  }, []);

  const Row = ({ icon, label, onPress, right }) => (
    <TouchableOpacity onPress={onPress} style={[styles.row, { backgroundColor: colors.surface }]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {right || <Text style={{ color: colors.textMuted, fontSize: 14 }}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.md, paddingBottom: 30 }}
    >
      <StatusBarDark />
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🌿</Text>
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>EvaReel User</Text>
          {unlocked ? (
            <View style={[styles.vipBadge, { backgroundColor: colors.gold }]}>
              <Text style={styles.vipBadgeText}>VIP Unlocked</Text>
            </View>
          ) : (
            <View style={[styles.vipBadge, { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' }]}>
              <Text style={[styles.vipBadgeText, { color: colors.gold }]}>Free</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { borderColor: 'rgba(212,175,55,0.16)' }]}>
          <Text style={[styles.statNum, { color: colors.text }]}>{savedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
        </View>
        <View style={[styles.stat, { borderColor: 'rgba(212,175,55,0.16)' }]}>
          <Text style={[styles.statNum, { color: colors.text }]}>{historyCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>History</Text>
        </View>
      </View>

      {!unlocked && (
        <TouchableOpacity onPress={() => setPaywallVisible(true)} style={[styles.vipCard, { borderColor: 'rgba(212,175,55,0.28)' }]}>
          <Text style={[styles.vipTitle, { color: colors.text }]}>Unlock Premium Videos</Text>
          <Text style={[styles.vipBadgeText, { color: colors.gold }]}>{vipPrice} · Tap to unlock</Text>
        </TouchableOpacity>
      )}

      <View style={styles.list}>
        <Row
          icon="🔔"
          label="Notifications"
          onPress={() => {}}
          right={<Switch value={notifications} onValueChange={setNotifications} />}
        />
        <Row icon="⭐" label="Rate EvaReel" onPress={() => {}} />
        <Row icon="🔒" label="Privacy Policy" onPress={() => {}} />
        <Row icon="↩️" label="Restore Purchase" onPress={() => restoreVip()} />
        <Row icon="ℹ️" label="About" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3A2E24',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30 },
  identity: { flex: 1, marginLeft: 14 },
  name: { fontSize: 19, fontWeight: '800' },
  vipBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  vipBadgeText: { color: '#1A1410', fontWeight: '800', fontSize: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.16)' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  vipCard: { marginHorizontal: 16, marginTop: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)' },
  vipTitle: { fontSize: 17 },
  list: { marginTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  rowIcon: { fontSize: 16, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
