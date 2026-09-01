// ── Discover: search + categories + trending/recent chips + status filter + grid ──
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import CategoryTabs from '../components/CategoryTabs';
import PosterCard from '../components/PosterCard';
import { categories, hotSearches, byCategory, useCatalogue, searchCatalogue } from '../data/catalogue';

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
  const all = useCatalogue();

  useEffect(() => {
    loadSearchHistory().then(setHistory);
  }, []);

  useEffect(() => {
    applyFilter(keyword, activeTab, status, page);
  }, [all]);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(byCategory(activeTab).filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, activeTab, all]);

  const applyFilter = useCallback(async (kw, cat, st, p = 1) => {
    let base = kw.trim() ? await searchCatalogue(kw) : byCategory(cat);
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

  const renderGridItem = useCallback(({ item }) => (
    <PosterCard
      drama={item}
      locked={lockedIds && lockedIds.has(item.id)}
      onPress={() => openDetail(item)}
    />
  ), [lockedIds, openDetail]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderHeader = useCallback(() => (
    <View>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Discover</Text>
        <Text style={[styles.pageSub, { color: colors.textMuted }]}>Search dramas, genres & more</Text>
      </View>

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
        {keyword.length > 0 ? (
          <TouchableOpacity onPress={() => { setKeyword(''); setPage(1); applyFilter('', activeTab, status); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.blockLabel, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>Categories</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.xs }}>
        <CategoryTabs tabs={categories} active={activeTab} onChange={(t) => { setActiveTab(t); setPage(1); if (t !== 'More') applyFilter(keyword, t, status); }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, marginHorizontal: spacing.md, borderColor: colors.borderGold }]}>
        <View style={styles.cardHead}>
          <Ionicons name="flame" size={16} color={colors.gold} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Trending Searches</Text>
        </View>
        <View style={styles.chipWrap}>
          {hotSearches.map((s, idx) => (
            <TouchableOpacity
              key={s}
              onPress={() => onSearch(s)}
              style={[styles.chip, { backgroundColor: colors.background, borderColor: 'rgba(255,77,46,0.35)' }]}
            >
              <Text style={[styles.chipRank, { color: idx < 3 ? colors.gold : colors.textMuted }]}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>#{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {history.length > 0 && !keyword ? (
        <View style={[styles.card, { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginTop: spacing.sm, borderColor: colors.borderGold }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent</Text>
            <TouchableOpacity onPress={clearHistory} hitSlop={8}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {history.map((h) => (
              <TouchableOpacity key={h} onPress={() => onSearch(h)} style={[styles.chip, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.statusRow, { paddingHorizontal: spacing.md, marginTop: spacing.sm }]}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => {
              setStatus(s);
              setPage(1);
              applyFilter(keyword, activeTab, s);
            }}
            style={[styles.statusChip, { backgroundColor: colors.surface, borderColor: colors.borderGold }, status === s && { backgroundColor: colors.gold, borderColor: colors.gold }]}
          >
            <Text style={{ color: status === s ? '#200B06' : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, spacing, keyword, activeTab, status, history, onSearch, applyFilter]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xs }]}>
      <FlatList
        data={grid}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderGridItem}
        ListHeaderComponent={renderHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }]}
        columnWrapperStyle={styles.row}
        style={styles.list}
        initialNumToRender={12}
        ListEmptyComponent={null}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: { paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  header: { marginTop: 2, marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  pageSub: { fontSize: 12, marginTop: 1 },
  searchWrap: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  search: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 14,
    outlineStyle: 'none',
  },
  blockLabel: { marginTop: 12, marginBottom: 1 },
  blockTitle: { fontSize: 14, fontWeight: '800' },
  card: { marginTop: 8, borderRadius: 14, padding: 12, borderWidth: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginLeft: 5 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  chipRank: { fontSize: 11, fontWeight: '800', marginRight: 5 },
  statusRow: { flexDirection: 'row' },
  statusChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginRight: 6, borderWidth: 1 },
});
