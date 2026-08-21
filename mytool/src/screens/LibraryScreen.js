// ── Library: Saved / History tabs backed by AsyncStorage ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import DramaGrid from '../components/DramaGrid';
import { dramas } from '../data/mockDramas';
import { loadSaved, loadHistory, syncLibraryFromServer } from '../data/libraryStore';

const byId = (id) => dramas.find((d) => String(d.id) === String(id).replace(/-r$/, ''));

export default function LibraryScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [tab, setTab] = useState('Saved');
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);

  const reload = useCallback(() => {
    syncLibraryFromServer().finally(() => {
      loadSaved().then(setSaved);
      loadHistory().then(setHistory);
    });
  }, []);

  useFocusEffect(reload);

  const openDetail = useCallback((drama) => {
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('DramaDetail', { id: drama.id });
  }, [navigation, unlocked, setPaywallVisible]);

  const savedList = saved.map(byId).filter(Boolean);
  const historyList = history.map((h) => byId(h.id)).filter(Boolean);

  const segments = [
    { key: 'Saved', label: 'Saved', count: savedList.length },
    { key: 'History', label: 'History', count: historyList.length },
  ];

  const isEmpty = (tab === 'Saved' && savedList.length === 0) || (tab === 'History' && historyList.length === 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,77,46,0.12)' }]}>
          <Ionicons name="heart" size={22} color={colors.gold} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>My Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {savedList.length} saved · {historyList.length} watched
          </Text>
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: colors.surface, borderRadius: 999, marginHorizontal: spacing.md }]}>
        {segments.map((s) => {
          const active = tab === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => setTab(s.key)}
              style={[styles.segmentBtn, active && { backgroundColor: colors.gold }]}
            >
              <Text style={[styles.segmentText, { color: active ? '#200B06' : colors.textMuted }]}>{s.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: active ? 'rgba(0,0,0,0.12)' : colors.background }]}>
                <Text style={[styles.countText, { color: active ? '#200B06' : colors.textMuted }]}>{s.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isEmpty ? (
        <EmptyHint tab={tab} />
      ) : (
        <DramaGrid data={tab === 'Saved' ? savedList : historyList} onPressItem={openDetail} />
      )}
    </View>
  );
}

function EmptyHint({ tab }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: 'rgba(255,77,46,0.10)' }]}>
        <Ionicons name={tab === 'Saved' ? 'heart-outline' : 'time-outline'} size={40} color={colors.gold} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {tab === 'Saved' ? 'No saved dramas yet' : 'No watch history yet'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {tab === 'Saved'
          ? 'Tap the heart on any drama to save it here.'
          : 'Start watching episodes and they will show up here.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  segment: { flexDirection: 'row', padding: 4, marginBottom: 14 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 999 },
  segmentText: { fontSize: 14, fontWeight: '700' },
  countBadge: { marginLeft: 8, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontSize: 12, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 },
  emptyIcon: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
