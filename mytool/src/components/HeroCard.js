// ── Full-width 16:9 hero card: bundled poster (fallback theme art), overlay, Play pill ──
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { dramaTheme } from './DramaCover';
import CoverImage from './CoverImage';

export default function HeroCard({ drama, onPlay, onPress }) {
  const { colors, radii, fonts } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { borderRadius: radii.card }]}>
      <CoverImage
        asset={drama.asset}
        fallback={<LinearGradient colors={dramaTheme(drama.id)} style={styles.image} />}
        style={styles.image}
      />
      <LinearGradient
        colors={['transparent', 'rgba(10,6,4,0.55)', 'rgba(10,6,4,0.92)']}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      />
      <View style={styles.info}>
        <Text style={[styles.title, fonts.display, { color: colors.text }]} numberOfLines={2}>
          {drama.title}
        </Text>
        <Text style={[styles.subtitle, fonts.displayMedium, { color: colors.text }]} numberOfLines={1}>
          {drama.subtitle}
        </Text>
        <Text style={[styles.episodes, { color: colors.textMuted }]}>{drama.episodes} Episodes</Text>
        <TouchableOpacity
          onPress={onPlay}
          style={[styles.playBtn, { backgroundColor: colors.gold, borderRadius: radii.pill }]}
        >
          <Text style={styles.playText}>▶ Play</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,77,46,0.25)' },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  info: { padding: 18 },
  title: { fontSize: 28, lineHeight: 32 },
  subtitle: { fontSize: 18, marginTop: 3 },
  episodes: { fontSize: 13, marginTop: 7 },
  playBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 8,
    marginTop: 10,
  },
  playText: { color: '#200B06', fontWeight: '800', fontSize: 15 },
});
