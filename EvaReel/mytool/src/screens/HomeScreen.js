// ── Home: category tabs + hero + trending/new-release grids ──
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
  const [trendingList, setTrendingList] = useState(trending);
  const [newList, setNewList] = useState(newReleases);
  const [filtered, setFiltered] = useState([]);
  const [filterPage, setFilterPage] = useState(1);
  const pendingPlay = useRef(null);

  const lockedIds = useMemo(() => {
    // Everything that has no hosted video shows as locked ("暂未开放"),
    // regardless of IAP unlock state — including premium titles.
    return new Set(dramas.filter((d) => !d.available).map((d) => d.id));
  }, []);

  const openDetail = useCallback((drama) => {
    if (!drama.available) {
      Alert.alert('暂未开放', '该内容暂未开放，敬请期待～');
      return;
    }
    navigation.navigate('DramaDetail', { id: drama.id });
  }, [navigation]);

  const openPlayer = useCallback((drama) => {
    if (!drama.available) {
      Alert.alert('暂未开放', '该内容暂未开放，敬请期待～');
      return;
    }
    if (drama.premium && !unlocked) {
      pendingPlay.current = { id: drama.id, episode: 1 };
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode: 1 });
  }, [navigation, unlocked, setPaywallVisible]);

  // After a successful purchase, jump straight into the player the user
  // was trying to watch instead of dumping them back on Home.
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
    // Only "For You" shows the one real video. Every other tab is "coming soon".
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
