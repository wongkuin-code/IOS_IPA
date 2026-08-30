// ── Home (For You): scrollable real content feed ──
//  Now shows every hosted, playable video (id 1–9) in a browsable feed so the
//  app reads as a real content library instead of a single-video shell.
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import HeroCard from '../components/HeroCard';
import PosterCard from '../components/PosterCard';
import { dramas } from '../data/mockDramas';

export default function HomeScreen() {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const pendingPlay = useRef(null);

  const available = useMemo(() => dramas.filter((d) => d.available), [dramas]);
  const featured = available[0];
  const rest = available.slice(1);

  const openPlayer = useCallback(
    (drama) => {
      if (!drama || !drama.available) return; // locked tiles do nothing
      if (drama.premium && !unlocked) {
        pendingPlay.current = { id: drama.id, episode: 1 };
        setPaywallVisible(true);
        return;
      }
      navigation.navigate('Player', { id: drama.id, episode: 1 });
    },
    [navigation, unlocked, setPaywallVisible]
  );

  // After a successful purchase, jump straight into the player the user wanted.
  useEffect(() => {
    if (unlocked && pendingPlay.current) {
      const target = pendingPlay.current;
      pendingPlay.current = null;
      navigation.navigate('Player', target);
    }
  }, [unlocked, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBarDark />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <Text style={[styles.title, fonts.display, { color: colors.text }]}>EvaReel</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Healing nature videos</Text>
        </View>

        {featured ? (
          <HeroCard
            drama={featured}
            onPlay={() => openPlayer(featured)}
            onPress={() => openPlayer(featured)}
            style={{ marginTop: spacing.md, marginHorizontal: spacing.md, aspectRatio: 16 / 9 }}
          />
        ) : null}

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, paddingHorizontal: spacing.md, marginTop: 24 },
          ]}
        >
          All Videos
        </Text>

        <View style={[styles.grid, { paddingHorizontal: spacing.md }]}>
          {rest.map((d) => (
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
  header: { marginBottom: 6 },
  title: { fontSize: 26, lineHeight: 30 },
  subtitle: { fontSize: 14, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cell: { width: '31.5%', marginBottom: 16 },
});
