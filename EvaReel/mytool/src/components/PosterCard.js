// ── 2:3 poster card: bundled poster image (fallback art), title + gold rating badge ──
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import DramaCover from './DramaCover';
import CoverImage from './CoverImage';

export default function PosterCard({ drama, locked, onPress }) {
  const { colors, radii } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrap}>
      <View style={[styles.poster, { borderRadius: radii.card }]}>
        <CoverImage
          asset={drama.asset}
          fallback={<DramaCover drama={drama} style={styles.image} />}
          style={styles.image}
        />
        <View style={[styles.topHighlight, { backgroundColor: colors.gold }]} />
        <LinearGradient
          colors={[colors.rating[0], colors.rating[1], colors.rating[2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{drama.rating.toFixed(1)}</Text>
        </LinearGradient>
        {locked ? (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>暂未开放</Text>
          </View>
        ) : null}
        {!locked && drama.premium ? (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {drama.title}
      </Text>
      <Text style={[styles.ep, { color: colors.textMuted }]}>EP.{drama.episodes}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, marginHorizontal: 6 },
  poster: {
    aspectRatio: 2 / 3,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,175,55,0.35)',
  },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  topHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: '#1A1410', fontSize: 11, fontWeight: '800' },
  lock: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(26,20,16,0.75)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lockText: { fontSize: 11 },
  lockedOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,20,16,0.62)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  lockedText: { color: '#F5D98B', fontSize: 12, fontWeight: '700' },
  proBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(212,175,55,0.92)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  proText: { color: '#1A1410', fontSize: 10, fontWeight: '800' },
  title: { fontSize: 13, fontWeight: '600', marginTop: 8, lineHeight: 17 },
  ep: { fontSize: 11, marginTop: 4 },
});
