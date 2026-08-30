// ── Discover: real, browsable grid of every hosted video ──
import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import PosterCard from '../components/PosterCard';
import { dramas } from '../data/mockDramas';

export default function DiscoverScreen() {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();

  const available = useMemo(() => dramas.filter((d) => d.available), [dramas]);

  const openPlayer = (drama) => {
    if (!drama || !drama.available) return;
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode: 1 });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBarDark />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <Text style={[styles.title, fonts.display, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {available.length} healing videos to relax with
          </Text>
        </View>

        <View style={[styles.grid, { paddingHorizontal: spacing.md }]}>
          {available.map((d) => (
            <View key={d.id} style={styles.cell}>
              <PosterCard drama={d} locked={false} onPress={() => openPlayer(d)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { marginBottom: 16 },
  title: { fontSize: 26, lineHeight: 30 },
  subtitle: { fontSize: 14, marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cell: { width: '31.5%', marginBottom: 16 },
});
