// ── Discover: search input + hot chips + status filter + category tabs + grid ──
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import { Ionicons } from '@expo/vector-icons';
import StatusBarDark from '../components/StatusBarDark';
import CategoryTabs from '../components/CategoryTabs';
import DramaGrid from '../components/DramaGrid';
import { categories, hotSearches, searchDramas, byCategory, moreOf } from '../data/mockDramas';

const SEARCH_HISTORY_KEY = 'evashort_search_history';
const STATUS_FILTERS = ['All', 'Ongoing', 'Completed'];

async function loadSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function pushSearchHistory(kw) {
  const q = (kw || '').trim();
  if (!q) return;
  const list = await loadSearchHistory();
  const next = [q, ...list.filter((x) => x !== q)].slice(0, 8);
  try {
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch (e) {
    // ignore
  }
}

export default function DiscoverScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('For You');
  const [status, setStatus] = useState('All');
  const [grid, setGrid] = useState([]);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadSearchHistory().then(setHistory);
  }, []);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(byCategory(activeTab).filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, activeTab]);

  const applyFilter = useCallback((kw, cat, st, p = 1) => {
    let base = kw.trim() ? searchDramas(kw) : byCategory(cat);
    if (st === 'Ongoing') base = base.filter((d) => d.status === 'Ongoing');
    else if (st === 'Completed') base = base.filter((d) => d.status === 'Completed');
    setGrid(base.slice(0, p * 30));
  }, []);

  const onSearch = useCallback((kw) => {
    pushSearchHistory(kw);
    setKeyword(kw);
    setPage(1);
    applyFilter(kw, activeTab, status);
    loadSearchHistory().then(setHistory);
  }, [activeTab, status, applyFilter]);

  const openDetail = useCallback((drama) => {
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('DramaDetail', { id: drama.id });
  }, [navigation, unlocked, setPaywallVisible]);

  const loadMore = useCallback(() => {
    setPage((p) => {
      const next = p + 1;
      applyFilter(keyword, activeTab, status, next);
      return next;
    });
  }, [keyword, activeTab, status, applyFilter]);

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      // ignore
    }
    setHistory([]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          value={keyword}
          onChangeText={(t) => {
            setKeyword(t);
            setPage(1);
            applyFilter(t, activeTab, status);
          }}
          onSubmitEditing={() => pushSearchHistory(keyword)}
          returnKeyType="search"
          placeholder="Search dramas or genres"
          placeholderTextColor={colors.textMuted}
          style={[styles.search, { color: colors.text }]}
        />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>🔥 Trending Searches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {hotSearches.map((s, idx) => (
          <TouchableOpacity
            key={s}
            onPress={() => onSearch(s)}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: 'rgba(255,77,46,0.4)' }]}
          >
            <Text style={[styles.chipRank, { color: idx < 3 ? colors.gold : colors.textMuted }]}>
              {String(idx + 1).padStart(2, '0')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>#{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {history.length > 0 && !keyword ? (
        <View style={styles.historyBlock}>
          <View style={styles.historyRow}>
            <Text style={[styles.historyTitle, { color: colors.textMuted }]}>Recent</Text>
            <TouchableOpacity onPress={clearHistory} hitSlop={8}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
            {history.map((h) => (
              <TouchableOpacity key={h} onPress={() => onSearch(h)} style={[styles.historyChip, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>🔍 {h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.statusRow, { paddingHorizontal: spacing.md }]}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => {
              setStatus(s);
              setPage(1);
              applyFilter(keyword, activeTab, s);
            }}
            style={[styles.statusChip, { backgroundColor: colors.surface }, status === s && { backgroundColor: colors.gold }]}
          >
            <Text style={{ color: status === s ? '#200B06' : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.sm }}>
        <CategoryTabs tabs={categories} active={activeTab} onChange={(t) => { setActiveTab(t); setPage(1); if (t !== 'More') applyFilter(keyword, t, status); }} />
      </View>
      <DramaGrid data={grid} lockedIds={lockedIds} onPressItem={openDetail} onEndReached={loadMore} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: {
    marginHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  search: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 9,
    fontSize: 15,
    outlineStyle: 'none',
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginTop: 16, marginHorizontal: 18, marginBottom: 10, letterSpacing: 0.5 },
  chips: { flexGrow: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginRight: 10 },
  chipRank: { fontSize: 12, fontWeight: '800', marginRight: 6 },
  historyBlock: { marginTop: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 8 },
  historyTitle: { fontSize: 12, fontWeight: '700' },
  historyChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  statusRow: { flexDirection: 'row', marginTop: 12 },
  statusChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
});