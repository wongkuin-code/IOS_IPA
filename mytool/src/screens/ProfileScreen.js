// ── Profile: avatar, stats, VIP row, settings list ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>EvaReel User</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>@evareel.member</Text>
        </View>
        {unlocked ? (
          <View style={[styles.vipBadge, { backgroundColor: colors.gold }]}>
            <Text style={styles.vipBadgeText}>★ VIP</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.stats, { paddingHorizontal: spacing.md }]}>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{(savedCount + historyCount) * 128}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Views</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{savedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{historyCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Watched</Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => setPaywallVisible(true)} style={[styles.vipCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.vipTitle, fonts.display, { color: colors.gold }]}>
          {unlocked ? 'Premium Unlocked — thank you!' : 'Unlock Premium Dramas'}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
          {unlocked ? 'All premium content is available.' : 'One-time purchase · lifetime access · ¥1'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.list, { paddingHorizontal: spacing.md }]}>
        <Row icon="♻️" label="Restore Purchase" onPress={restoreVip} />
        <Row
          icon="🔔"
          label="Notifications"
          right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: colors.gold }} />}
        />
        <Row icon="⭐" label="Rate Us" onPress={() => {}} />
        <Row icon="📄" label="Privacy Policy" onPress={() => {}} />
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          EvaReel v1.0.0
        </Text>
      </View>
    </View>
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
