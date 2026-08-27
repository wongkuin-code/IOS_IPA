// ── Home (For You): minimal, non-scrolling review screen ──
//  Review strategy: show only the ONE real playable video + a fixed row of
//  "Coming Soon" placeholders. No scroll, no "More", no load-more, no tab
//  switching — so the reviewer cannot browse into un-implemented areas.
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import HeroCard from '../components/HeroCard';
import { dramas } from '../data/mockDramas';

export default function HomeScreen() {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unlocked, setPaywallVisible } = useUnlock();
  const pendingPlay = useRef(null);

  // Exactly one real, hosted video; everything else stays behind "Coming Soon".
  const real = useMemo(() => dramas.find((d) => d.available), [dramas]);

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
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.title, fonts.display, { color: colors.text }]}>EvaReel</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Healing nature videos</Text>
      </View>

      <HeroCard
        drama={real}
        onPlay={() => openPlayer(real)}
        onPress={() => openPlayer(real)}
        style={{ flex: 1, width: undefined, aspectRatio: 9 / 16, alignSelf: 'center', marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { marginBottom: 14 },
  title: { fontSize: 26, lineHeight: 30 },
  subtitle: { fontSize: 14, marginTop: 2 },
});
