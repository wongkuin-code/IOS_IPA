// ── Full-width 16:9 hero card: real frame, letterboxed with a dimmed
//    zoomed copy of the same frame filling the side bars, overlay, Play pill ──
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { dramaTheme } from './DramaCover';

export default function HeroCard({ drama, onPlay, onPress, style }) {
  const { colors, radii, fonts } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { borderRadius: radii.card }, style]}>
      <View style={styles.image}>
        {drama.asset ? (
          <>
            {/* dimmed, zoomed copy fills the letterbox side bars */}
            <Image source={drama.asset} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.backdropDim} />
            {/* full, un-cropped frame, centered */}
            <Image source={drama.asset} style={StyleSheet.absoluteFill} resizeMode="contain" />
          </>
        ) : (
          <LinearGradient colors={dramaTheme(drama.id)} style={StyleSheet.absoluteFill} />
        )}
      </View>
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
  card: { position: 'relative', width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  backdropDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,6,4,0.55)' },
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
  playText: { color: '#1A1410', fontWeight: '800', fontSize: 15 },
});
