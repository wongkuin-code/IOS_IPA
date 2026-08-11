// ── Player: full-screen mock 9:16 video + bottom controls ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import { dramas } from '../data/mockDramas';
import { addHistory } from '../data/libraryStore';

const SPEEDS = [0.5, 1.0, 1.5, 2.0];

export default function PlayerScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { id, episode } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();
  const [ep, setEp] = useState(Number(episode) || 1);
  const [speed, setSpeed] = useState(1.0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(38);

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return dramas.find((d) => d.id === idNum);
  }, [id]);

  const watch = useCallback((nextEp) => {
    if (drama.premium && !unlocked) {
      setPaywallVisible(true);
      return;
    }
    setEp(nextEp);
    setPlaying(true);
    setProgress(0);
    addHistory(drama.id, nextEp);
  }, [drama, unlocked, setPaywallVisible]);

  const next = () => {
    if (ep < drama.episodes) watch(ep + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: '#000', paddingTop: insets.top }]}>
      <StatusBarDark />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, fonts.display, { color: colors.text }]} numberOfLines={1}>
          {drama ? drama.title : ''}
        </Text>
        <Text style={[styles.epLabel, { color: colors.textMuted }]}>EP.{ep}/{drama ? drama.episodes : '?'}</Text>
      </View>

      <LinearGradient
        colors={['#120C08', colors.surface, '#120C08']}
        style={styles.videoArea}
      >
        <TouchableOpacity style={styles.playBig} onPress={() => setPlaying((p) => !p)}>
          <Text style={styles.playBigText}>{playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <Text style={[styles.mockHint, { color: colors.textMuted }]}>
          {playing ? 'Mock video playing… (vertical 9:16)' : 'Tap to play'}
        </Text>
      </LinearGradient>

      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.gold }]} />
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => watch(ep)} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>↻</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
            style={[styles.ctrl, styles.speedBtn]}
          >
            <Text style={styles.speedText}>{speed.toFixed(1)}x</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Speed</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} disabled={ep >= drama.episodes} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>⏭</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Next EP.{ep + 1}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {drama.title} · EP.{ep}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 32, alignItems: 'center' },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  title: { flex: 1, fontSize: 16, marginHorizontal: 8 },
  epLabel: { fontSize: 13, fontWeight: '700' },
  videoArea: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 9 / 16,
    alignSelf: 'center',
  },
  playBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBigText: { color: '#1A1410', fontSize: 28, marginLeft: 3 },
  mockHint: { fontSize: 12, marginTop: 12 },
  sheet: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.22)' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  ctrl: { alignItems: 'center', minWidth: 64 },
  ctrlIcon: { fontSize: 22, color: '#fff' },
  ctrlLabel: { fontSize: 11, marginTop: 4 },
  speedBtn: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speedText: { color: '#F5D98B', fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});
