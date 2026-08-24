// ── Profile: real account info, stats, VIP, settings list ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import { useAuth } from '../auth/AuthContext';
import StatusBarDark from '../components/StatusBarDark';
import { loadSaved, loadHistory } from '../data/libraryStore';

export default function ProfileScreen() {
  const { colors, spacing, fonts, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible, restoreVip } = useUnlock();
  const { user, logout, deleteAccount } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    loadSaved().then((l) => setSavedCount(l.length));
    loadHistory().then((l) => setHistoryCount(l.length));
  }, []);

  const isGuest = Boolean(user && user.isGuest);
  const memberSince = user && user.createdAt
    ? new Date(user.createdAt).toISOString().slice(0, 10)
    : null;

  const confirmDelete = async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const r = await deleteAccount(deletePw);
    setDeleteBusy(false);
    if (!r.ok) {
      setDeleteError(r.error || 'Something went wrong');
      return;
    }
    setDeleteVisible(false);
    setDeletePw('');
  };

  const Row = ({ icon, iconName, label, onPress, right, danger }) => (
    <TouchableOpacity onPress={onPress} style={[styles.row, { backgroundColor: colors.surface }]}>
      {iconName ? (
        <Ionicons name={iconName} size={18} color={danger ? colors.danger : colors.gold} style={styles.rowIconBox} />
      ) : (
        <Text style={styles.rowIcon}>{icon}</Text>
      )}
      <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
      {right || <Text style={{ color: colors.textMuted, fontSize: 14 }}>›</Text>}
    </TouchableOpacity>
  );

  // 浅色 / 深色 外观切换分段控件
  const AppearanceToggle = () => (
    <View style={styles.seg}>
      {['Light', 'Dark'].map((m) => {
        const active = mode === m.toLowerCase();
        return (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m.toLowerCase())}
            style={[styles.segBtn, active && { backgroundColor: colors.gold }]}
          >
            <Ionicons
              name={m === 'Light' ? 'sunny-outline' : 'moon-outline'}
              size={14}
              color={active ? '#200B06' : colors.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.segText, { color: active ? '#200B06' : colors.textMuted }]}>{m}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user && user.avatar) || '👤'}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>
            {(user && user.nickname) || 'Guest'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
            {isGuest ? 'Guest account · upgrade to keep your library' : user.account || user.nickname}
          </Text>
          {memberSince ? (
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Member since {memberSince}</Text>
          ) : null}
        </View>
        {unlocked ? (
          <View style={[styles.vipBadge, { backgroundColor: colors.gold }]}>
            <Text style={styles.vipBadgeText}>★ VIP</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.stats, { paddingHorizontal: spacing.md }]}>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{savedCount + historyCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Watched</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{savedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.gold }]}>{historyCount * 100 + savedCount * 200}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
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
        <Row icon="✏️" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <Row iconName="heart" label="My Library" onPress={() => navigation.navigate('Library')} />
        {isGuest ? (
          <Row icon="⭐" label="Upgrade to Full Account" onPress={() => navigation.navigate('EditProfile')} />
        ) : null}
        <Row icon="🌗" label="Appearance" right={<AppearanceToggle />} />
        <Row icon="♻️" label="Restore Purchase" onPress={restoreVip} />
        <Row
          icon="🔔"
          label="Notifications"
          right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: colors.gold }} />}
        />
        <Row icon="📄" label="Privacy Policy" onPress={() => {}} />
        {!isGuest ? (
          <Row icon="🗑️" label="Delete Account" onPress={() => { setDeletePw(''); setDeleteError(null); setDeleteVisible(true); }} danger />
        ) : null}
        <Row icon="🚪" label="Log Out" onPress={logout} danger />
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          EvaShort v{Constants.expoConfig?.version || '1.0.0'} (build{' '}
          {Constants.expoConfig?.ios?.buildNumber || 'dev'})
        </Text>
      </View>

      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <View style={styles.deleteMask}>
          <View style={[styles.deleteCard, { backgroundColor: colors.surface, borderColor: 'rgba(230,46,92,0.4)' }]}>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6 }}>
              This permanently deletes your account, saved dramas and watch history. Enter your password to confirm.
            </Text>
            <TextInput
              value={deletePw}
              onChangeText={setDeletePw}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[styles.deleteInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderGold }]}
            />
            {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
            <TouchableOpacity
              disabled={deleteBusy}
              onPress={confirmDelete}
              style={[styles.deleteBtn, deleteBusy && { opacity: 0.6 }]}
            >
              {deleteBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete Forever</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteVisible(false)} hitSlop={8}>
              <Text style={[styles.deleteCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderColor: 'rgba(255,77,46,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30 },
  identity: { flex: 1, marginLeft: 14 },
  name: { fontSize: 19, fontWeight: '800' },
  vipBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  vipBadgeText: { color: '#200B06', fontWeight: '800', fontSize: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,77,46,0.16)' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  vipCard: { marginHorizontal: 16, marginTop: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,77,46,0.28)' },
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
    borderColor: 'rgba(255,77,46,0.12)',
  },
  rowIcon: { fontSize: 16, marginRight: 12 },
  rowIconBox: { marginRight: 12, width: 18, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(255,77,46,0.10)', borderRadius: 999, padding: 3 },
  segBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  segText: { fontSize: 13, fontWeight: '700' },
  deleteMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  deleteCard: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1 },
  deleteTitle: { fontSize: 20, fontWeight: '800' },
  deleteInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginTop: 16 },
  deleteError: { fontSize: 12, color: '#E8A08B', marginTop: 8 },
  deleteBtn: { backgroundColor: '#E62E5C', alignItems: 'center', paddingVertical: 14, borderRadius: 999, marginTop: 18 },
  deleteBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteCancel: { marginTop: 14, fontSize: 13, textAlign: 'center' },
});
