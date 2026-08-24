// ── Home: category tabs + hero + trending/new-release grids ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import CategoryTabs from '../components/CategoryTabs';
import SearchButton from '../components/SearchButton';
import HeroCard from '../components/HeroCard';
import SectionHeader from '../components/SectionHeader';
import DramaGrid from '../components/DramaGrid';
import { categories, dramas, trending, newReleases, byCategory, moreOf } from '../data/mockDramas';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [activeTab, setActiveTab] = useState('For You');
  const [trendingList, setTrendingList] = useState(trending);
  const [newList, setNewList] = useState(newReleases);
  const [filtered, setFiltered] = useState([]);
  const [filterPage, setFilterPage] = useState(1);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(dramas.filter((d) => d.premium).map((d) => d.id));
  }, [unlocked]);

  const openDetail = useCallback((drama) => {
    navigation.navigate('DramaDetail', { id: drama.id });
  }, [navigation]);

  const openPlayer = useCallback((drama) => {
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode: 1 });
  }, [navigation, unlocked, setPaywallVisible]);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    setFilterPage(1);
    if (tab === 'More') {
      navigation.navigate('MoreList', { title: 'All Dramas', list: dramas });
      return;
    }
    if (tab !== 'For You') {
      setFiltered(byCategory(tab).slice(0, 30));
    }
  }, [navigation]);

  const loadMoreFiltered = useCallback(() => {
    setFilterPage((p) => {
      const next = p + 1;
      setFiltered((prev) => moreOf(byCategory(activeTab)).slice(0, next * 30));
      return next;
    });
  }, [activeTab]);

  const showMoreSection = useCallback((title, list) => {
    navigation.navigate('MoreList', { title, list });
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.topRow, { paddingHorizontal: spacing.md }]}>
        <CategoryTabs tabs={categories} active={activeTab} onChange={changeTab} />
        <SearchButton onPress={() => navigation.navigate('Discover')} />
      </View>
      {activeTab === 'For You' ? (
        <View style={styles.scrollWrap}>
          <HeroCard drama={trending[0]} onPlay={() => openPlayer(trending[0])} onPress={() => openDetail(trending[0])} />
          <SectionHeader title="🔥 Trending Now" onMore={() => showMoreSection('Trending Now', trendingList)} />
          <DramaGrid data={trendingList} lockedIds={lockedIds} onPressItem={openDetail} onEndReached={() => setTrendingList((l) => moreOf(l))} />
          <SectionHeader title="New Releases" onMore={() => showMoreSection('New Releases', newList)} />
          <DramaGrid data={newList} lockedIds={lockedIds} onPressItem={openDetail} onEndReached={() => setNewList((l) => moreOf(l))} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => showMoreSection('All Dramas', dramas)}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>Browse all dramas →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <DramaGrid
          data={filtered}
          lockedIds={lockedIds}
          onPressItem={openDetail}
          onEndReached={loadMoreFiltered}
          style={{ paddingTop: spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  scrollWrap: { flex: 1 },
  footer: { alignItems: 'center', paddingVertical: 14 },
  footerText: { fontSize: 13, fontWeight: '600' },
});
