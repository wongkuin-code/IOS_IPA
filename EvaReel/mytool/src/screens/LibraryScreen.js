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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <Text style={[styles.title, { color: colors.text }]}>My Library</Text>
      <View style={[styles.segment, { backgroundColor: colors.surface, borderRadius: 10 }]}>
        {['Saved', 'History'].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.segmentBtn, tab === t && { backgroundColor: colors.gold }]}>
            <Text style={[styles.segmentText, { color: tab === t ? '#1A1410' : colors.textMuted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'Saved' && savedList.length === 0 ? (
        <EmptyHint text="Nothing saved yet. Tap the bookmark on any drama to save it." />
      ) : tab === 'History' && historyList.length === 0 ? (
        <EmptyHint text="No watch history yet. Start watching episodes." />
      ) : (
        <DramaGrid data={tab === 'Saved' ? savedList : historyList} onPressItem={openDetail} />
      )}
    </View>
  );
}

function EmptyHint({ text }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', marginHorizontal: 16, marginBottom: 12 },
  segment: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, padding: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});
