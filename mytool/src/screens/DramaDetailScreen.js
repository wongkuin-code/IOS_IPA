// ── Drama detail: hero + episode list + play CTA + save toggle ──
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import HeroCard from '../components/HeroCard';
import { dramas } from '../data/mockDramas';
import { loadSaved, toggleSaved } from '../data/libraryStore';

export default function DramaDetailScreen() {
  const { colors, spacing, fonts, radii } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return dramas.find((d) => d.id === idNum);
  }, [id]);

  useEffect(() => {
    if (!drama) return;
    loadSaved().then((list) => setSaved(list.includes(drama.id)));
    setLoaded(true);
  }, [drama]);

  const locked = drama.premium && !unlocked;

  const play = useCallback((episode) => {
    if (locked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode });
  }, [locked, drama, navigation, setPaywallVisible]);

  const onSave = useCallback(async () => {
    setSaved(await toggleSaved(drama.id));
  }, [drama]);

  if (!drama) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const episodes = Array.from({ length: drama.episodes }, (_, i) => i + 1);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBarDark />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View>
          <HeroCard drama={drama} onPlay={() => play(1)} onPress={() => play(1)} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          {locked ? (
            <View style={styles.lockBadge}>
              <Text style={[styles.lockText, { color: colors.text }]}>🔒 Premium</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.headerRow, { paddingHorizontal: spacing.md }]}>
          <View style={styles.titleCol}>
            <Text style={[styles.title, fonts.display, { color: colors.text }]} numberOfLines={2}>{drama.title}</Text>
            <Text style={[styles.subtitle, fonts.displayMedium, { color: colors.textMuted }]} numberOfLines={1}>{drama.subtitle}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {drama.episodes} Episodes · Rating {drama.rating.toFixed(1)} · {drama.category.join(' / ')}
            </Text>
          </View>
          <TouchableOpacity onPress={onSave} style={[styles.saveBtn, { backgroundColor: colors.surface, borderRadius: radii.pill }]}>
            <Text style={{ fontSize: 18 }}>{saved ? '🔖' : '📑'}</Text>
            <Text style={[styles.saveText, { color: saved ? colors.gold : colors.textMuted }]}>{saved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => play(1)}
          style={[styles.playCta, { backgroundColor: colors.gold, borderRadius: radii.pill, marginHorizontal: spacing.md }]}
        >
          <Text style={styles.playCtaText}>{locked ? `🔒 Unlock to Play from EP.1` : `▶ Play from EP.1`}</Text>
        </TouchableOpacity>
        <Text style={[styles.epTitle, { color: colors.text, paddingHorizontal: spacing.md }]}>Episodes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.epRow, { paddingHorizontal: spacing.md }]}>
          {episodes.map((ep) => (
            <TouchableOpacity key={ep} onPress={() => play(ep)} style={[styles.epCard, { backgroundColor: colors.surface, borderRadius: radii.card }]}>
              <Text style={[styles.epNum, { color: locked ? colors.textMuted : colors.text }]}>{ep}</Text>
              <Text style={[styles.epSub, { color: colors.textMuted }]}>EP.{ep}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: {
    position: 'absolute',
    top: 44,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 },
  lockBadge: {
    position: 'absolute',
    top: 44,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lockText: { fontSize: 12, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
  titleCol: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, lineHeight: 26 },
  subtitle: { fontSize: 15, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  saveBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)' },
  saveText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  playCta: { alignItems: 'center', paddingVertical: 14, marginTop: 16 },
  playCtaText: { color: '#1A1410', fontWeight: '800', fontSize: 16 },
  epTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  epRow: { paddingBottom: 8 },
  epCard: { width: 64, alignItems: 'center', paddingVertical: 12, marginRight: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.16)' },
  epNum: { fontSize: 18, fontWeight: '800' },
  epSub: { fontSize: 11, marginTop: 2 },
});
