// ── Home: category tabs + hero + trending/new-release grids ──
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
import ComingSoon from '../components/ComingSoon';
import { categories, dramas, trending, newReleases, byCategory, moreOf } from '../data/mockDramas';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [activeTab, setActiveTab] = useState('For You');
  const [filtered, setFiltered] = useState([]);
  const [filterPage, setFilterPage] = useState(1);
  const pendingPlay = useRef(null);

  // Submission build home: show only 1 real playable video + up to 4
  // "Coming Soon" placeholders, so we never expose the "all cards play the
  // same video" mismatch during review.
  const previewList = useMemo(() => {
    const real = dramas.filter((d) => d.available);
    const lockedSample = dramas.filter((d) => !d.available).slice(0, 4);
    return [...real, ...lockedSample];
  }, [dramas]);
  const [trendingList, setTrendingList] = useState(previewList);
  const [newList, setNewList] = useState(previewList);

  // Only real playable videos open the player; the rest show a "Coming Soon"
  // overlay and never enter the player.
  const lockedIds = useMemo(
    () => new Set(dramas.filter((d) => !d.available).map((d) => d.id)),
    [dramas]
  );

  const openPlayer = useCallback((drama) => {
    if (!drama.available) return;
    if (drama.premium && !unlocked) {
      pendingPlay.current = { id: drama.id, episode: 1 };
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode: 1 });
  }, [navigation, unlocked, setPaywallVisible]);

  // After a successful purchase, jump straight into the player the user wanted.
  useEffect(() => {
    if (unlocked && pendingPlay.current) {
      const target = pendingPlay.current;
      pendingPlay.current = null;
      navigation.navigate('Player', target);
    }
  }, [unlocked, navigation]);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    setFilterPage(1);
  }, []);

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
          <HeroCard drama={trending[0]} onPlay={() => openPlayer(trending[0])} onPress={() => openPlayer(trending[0])} />
          <SectionHeader title="🔥 Trending Now" onMore={() => showMoreSection('Trending Now', trendingList)} />
          <DramaGrid data={trendingList} lockedIds={lockedIds} onPressItem={openPlayer} />
          <SectionHeader title="New Releases" onMore={() => showMoreSection('New Releases', newList)} />
          <DramaGrid data={newList} lockedIds={lockedIds} onPressItem={openPlayer} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>More content coming soon →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ComingSoon />
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
