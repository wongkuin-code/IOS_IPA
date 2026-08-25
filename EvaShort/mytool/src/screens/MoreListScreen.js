// ── More list: pushed full listing screen (reuses DramaGrid) ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import DramaGrid from '../components/DramaGrid';
import { moreOf } from '../data/catalogue';

export default function MoreListScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { title, list } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();
  const [data, setData] = useState(list || []);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set((list || []).filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, list]);

  const openDetail = useCallback((drama) => {
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('DramaDetail', { id: drama.id });
  }, [navigation, unlocked, setPaywallVisible]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title || 'More'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <DramaGrid
        data={data}
        lockedIds={lockedIds}
        onPressItem={openDetail}
        onEndReached={() => setData((d) => moreOf(d))}
        style={{ paddingTop: spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
});
