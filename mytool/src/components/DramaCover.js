// ── Short-drama poster art: cinematic gradient + gold frame + display typography ──
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// Cinematic poster palettes (top → bottom), keyed by drama id
const THEMES = [
  ['#4A2A22', '#2A1610', '#100705'], // blood-red
  ['#26384E', '#14202F', '#090E17'], // midnight blue
  ['#3D2A4E', '#221436', '#0F0819'], // violet
  ['#3E3416', '#241D0A', '#0F0B04'], // amber
  ['#2B3A2B', '#182418', '#0A100A'], // deep green
  ['#46351C', '#2A1D0E', '#120C05'], // bronze
  ['#33302B', '#1F1C19', '#0F0D0B'], // charcoal
  ['#3A2326', '#211316', '#0E0809'], // wine
];

export function dramaTheme(id) {
  const n = Number(String(id).replace(/-r$/, '')) || 0;
  return THEMES[n % THEMES.length];
}

function genreOf(drama) {
  const g = (drama.category || []).find((c) => c !== 'ForYou' && c !== 'More');
  return (g || 'DRAMA').toUpperCase();
}

export default function DramaCover({ drama, style, textScale = 1 }) {
  const { colors, fonts } = useTheme();
  const [c1, c2, c3] = dramaTheme(drama.id);
  const t = textScale;
  return (
    <View style={[styles.art, style]}>
      <LinearGradient colors={[c1, c2, c3]} style={styles.fill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 0.55 }}
        style={styles.fill}
      />
      <LinearGradient
        colors={['rgba(5,3,2,0)', 'rgba(5,3,2,0.35)', 'rgba(5,3,2,0.88)']}
        locations={[0, 0.55, 1]}
        style={styles.fill}
      />
      <View style={styles.frameOuter} />
      <View style={styles.frameInner} />
      <View style={styles.topRow}>
        <Text style={[styles.topText, { color: colors.gold, fontSize: 8 * t + 1 }]}>✦ {genreOf(drama)}</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text
          numberOfLines={2}
          style={[styles.title, fonts.display, { fontSize: 15 * t, lineHeight: 17 * t }]}
        >
          {drama.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.subtitle, fonts.displayRegular, { color: colors.goldLight, fontSize: 10 * t }]}
        >
          {drama.subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject },
  frameOuter: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,77,46,0.45)',
  },
  frameInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,77,46,0.25)',
  },
  topRow: { position: 'absolute', top: 9, left: 9, right: 9 },
  topText: { fontWeight: '700', letterSpacing: 1.4 },
  titleBlock: { position: 'absolute', left: 9, right: 9, bottom: 9 },
  title: { color: '#FFF', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  subtitle: { marginTop: 3, letterSpacing: 0.6 },
});
