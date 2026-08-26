// ── Discover: search input + hot chips + category filter + grid ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import CategoryTabs from '../components/CategoryTabs';
import DramaGrid from '../components/DramaGrid';
import ComingSoon from '../components/ComingSoon';
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
    return new Set(byCategory(activeTab).filter((d) => !d.available).map((d) => d.id));
  }, [activeTab]);

  const refresh = useCallback((kw, cat, p = 1) => {
    const base = kw.trim() ? searchDramas(kw) : byCategory(cat);
    setGrid(base.slice(0, p * 30));
  }, []);

  const openDetail = useCallback((drama) => {
    if (!drama.available) {
      Alert.alert('Coming Soon', 'This content is not open yet. Stay tuned.');
      return;
    }
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

  return <ComingSoon subtitle="Search & discovery is coming soon. Stay tuned." />;
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
