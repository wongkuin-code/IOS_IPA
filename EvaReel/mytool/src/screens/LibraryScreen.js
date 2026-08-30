// ── Library: Saved / History tabs backed by AsyncStorage ──
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import DramaGrid from '../components/DramaGrid';
import { dramas } from '../data/mockDramas';
import { loadSaved, loadHistory } from '../data/libraryStore';

const byId = (id) => dramas.find((d) => d.id === String(id).replace(/-r$/, ''));

export default function LibraryScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [tab, setTab] = useState('Saved');
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);

  const reload = useCallback(() => {
    loadSaved().then(setSaved);
    loadHistory().then(setHistory);
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
  const data = tab === 'Saved' ? savedList : historyList;

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}
    >
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Library</Text>
      </View>
      <View style={[styles.segment, { marginHorizontal: spacing.md, backgroundColor: colors.surface }]}>
        {['Saved', 'History'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentBtn, tab === t && { backgroundColor: colors.gold }]}
          >
            <Text style={[styles.segmentText, { color: tab === t ? '#1A1410' : colors.textMuted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {tab === 'Saved'
              ? 'No saved videos yet. Tap 🔖 on any video to save it here.'
              : 'No watch history yet. Videos you play will appear here.'}
          </Text>
        </View>
      ) : (
        <DramaGrid data={data} onPressItem={openDetail} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 14 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
