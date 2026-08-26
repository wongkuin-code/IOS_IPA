// ── Profile: avatar, stats, VIP row, settings list ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
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
  const { unlocked, setPaywallVisible, restoreVip } = useUnlock();
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

  return <ComingSoon subtitle="Profile is coming soon. Stay tuned." />;
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
