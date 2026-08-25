// ── Drama detail: hero + synopsis + tags + episodes + similar ──
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import { useAuth } from '../auth/AuthContext';
import StatusBarDark from '../components/StatusBarDark';
import HeroCard from '../components/HeroCard';
import SectionHeader from '../components/SectionHeader';
import PosterStrip from '../components/PosterStrip';
import LoginPromptModal from '../components/LoginPromptModal';
import { useCatalogue, getDramas, similarTo, loadVideoDetail } from '../data/catalogue';
import { loadSaved, loadHistory, toggleSaved } from '../data/libraryStore';

export default function DramaDetailScreen() {
  const { colors, spacing, fonts, radii } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();
  const { user } = useAuth();
  const isGuest = Boolean(user && user.isGuest);
  const [saved, setSaved] = useState(false);
  const [watchedEps, setWatchedEps] = useState([]);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const all = useCatalogue();

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return getDramas().find((d) => d.id === idNum);
  }, [id, all]);

  // Pull the full episode list (with videoUrls) so Play has real sources.
  useEffect(() => {
    if (drama && (!drama.episodeVideos || drama.episodeVideos.length === 0)) {
      loadVideoDetail(drama.id);
    }
  }, [drama]);

  const similar = useMemo(() => (drama ? similarTo(drama) : []), [drama, all]);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(similar.filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, similar]);

  useEffect(() => {
    if (!drama) return;
    loadSaved().then((list) => setSaved(list.some((x) => String(x) === String(drama.id))));
    loadHistory().then((h) => {
      const item = h.find((x) => String(x.id) === String(drama.id));
      setWatchedEps(item ? [item.episode] : []);
    });
  }, [drama]);

  const locked = drama.premium && !unlocked;

  const play = useCallback((episode) => {
    if (locked) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('Player', { id: drama.id, episode });
  }, [locked, drama, navigation, setPaywallVisible]);

  const onSave = useCallback(() => {
    if (isGuest) {
      setLoginPrompt(true);
      return;
    }
    toggleSaved(drama.id).then((list) => setSaved(list.some((x) => String(x) === String(drama.id))));
  }, [isGuest, drama]);

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
              {drama.episodes} Episodes · ⭐ {drama.rating.toFixed(1)} · {drama.year} · {drama.status}
            </Text>
          </View>
          <TouchableOpacity onPress={onSave} style={[styles.saveBtn, { backgroundColor: colors.surface, borderRadius: radii.pill }]}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? colors.gold : colors.textMuted} />
            <Text style={[styles.saveText, { color: saved ? colors.gold : colors.textMuted }]}>{saved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tagsRow, { paddingHorizontal: spacing.md }]}>
          {(drama.tags || []).map((t) => (
            <View key={t} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>#{t}</Text>
            </View>
          ))}
          <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>👥 {drama.cast.join(' · ')}</Text>
          </View>
        </View>

        <Text style={[styles.synopsis, { color: colors.textMuted, paddingHorizontal: spacing.md }]}>
          {drama.description}
        </Text>

        <TouchableOpacity
          onPress={() => play(1)}
          style={[styles.playCta, { backgroundColor: colors.gold, borderRadius: radii.pill, marginHorizontal: spacing.md }]}
        >
          <Text style={styles.playCtaText}>{locked ? `🔒 Unlock to Play from EP.1` : `▶ Play from EP.1`}</Text>
        </TouchableOpacity>

        <Text style={[styles.epTitle, { color: colors.text, paddingHorizontal: spacing.md }]}>Episodes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.epRow, { paddingHorizontal: spacing.md }]}>
          {episodes.slice(0, 24).map((ep) => {
            const watched = watchedEps.includes(ep);
            return (
              <TouchableOpacity key={ep} onPress={() => play(ep)} style={[styles.epCard, { backgroundColor: colors.surface, borderRadius: radii.card }]}>
                <Text style={[styles.epNum, { color: locked ? colors.textMuted : colors.text }]}>{ep}</Text>
                <Text style={[styles.epSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {watched ? '✓ Watched' : `EP.${ep}`}
                </Text>
              </TouchableOpacity>
            );
          })}
          {drama.episodes > 24 ? (
            <Text style={[styles.epMore, { color: colors.textMuted }]}>+{drama.episodes - 24} more</Text>
          ) : null}
        </ScrollView>

        <SectionHeader title="More Like This" />
        <PosterStrip data={similar} lockedIds={lockedIds} onPressItem={(d) => navigation.navigate('DramaDetail', { id: d.id })} />
      </ScrollView>
      <LoginPromptModal
        visible={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        onLogin={() => {
          setLoginPrompt(false);
          navigation.navigate('Auth');
        }}
      />
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
  saveBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,77,46,0.22)' },
  saveText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 8 },
  synopsis: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  playCta: { alignItems: 'center', paddingVertical: 14, marginTop: 16 },
  playCtaText: { color: '#200B06', fontWeight: '800', fontSize: 16 },
  epTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  epRow: { paddingBottom: 8 },
  epCard: { width: 64, alignItems: 'center', paddingVertical: 12, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,77,46,0.16)' },
  epNum: { fontSize: 18, fontWeight: '800' },
  epSub: { fontSize: 10, marginTop: 2, maxWidth: 60 },
  epMore: { alignSelf: 'center', fontSize: 12, marginLeft: 4 },
});