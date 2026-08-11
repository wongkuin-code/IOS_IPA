// ── Discover: search input + hot chips + category filter + grid ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import CategoryTabs from '../components/CategoryTabs';
import DramaGrid from '../components/DramaGrid';
import { categories, hotSearches, searchDramas, byCategory, moreOf } from '../data/mockDramas';

export default function DiscoverScreen() {
  const { colors, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('For You');
  const [grid, setGrid] = useState([]);
  const [page, setPage] = useState(1);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(byCategory(activeTab).filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, activeTab]);

  const refresh = useCallback((kw, cat, p = 1) => {
    const base = kw.trim() ? searchDramas(kw) : byCategory(cat);
    setGrid(base.slice(0, p * 30));
  }, []);

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
      refresh(keyword, activeTab, next);
      return next;
    });
  }, [keyword, activeTab, refresh]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <TextInput
        value={keyword}
        onChangeText={(t) => {
          setKeyword(t);
          setPage(1);
          refresh(t, activeTab);
        }}
        placeholder="Search dramas"
        placeholderTextColor={colors.textMuted}
        style={[styles.search, { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.pill, borderColor: colors.gold }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {hotSearches.map((s) => (
          <TouchableOpacity key={s} onPress={() => { setKeyword(s); setPage(1); refresh(s, activeTab); }} style={[styles.chip, { backgroundColor: colors.surface, borderColor: 'rgba(212,175,55,0.4)' }]}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>#{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.sm }}>
        <CategoryTabs tabs={categories} active={activeTab} onChange={(t) => { setActiveTab(t); setPage(1); if (t !== 'More') refresh(keyword, t); }} />
      </View>
      <DramaGrid data={grid} lockedIds={lockedIds} onPressItem={openDetail} onEndReached={loadMore} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    marginHorizontal: 18,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
  },
  chips: { flexGrow: 0, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, marginRight: 10 },
});
