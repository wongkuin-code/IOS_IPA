// ── Player: real vertical 9:16 video via expo-video, premium-gated ──
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import { dramas } from '../data/mockDramas';
import { addHistory } from '../data/libraryStore';
import { fetchCatalog, getVideoUrl } from '../data/catalog';

const SPEEDS = [0.5, 1.0, 1.5, 2.0];

// Real video element for one episode. Remounted (keyed by episode) when the
// user switches episodes. Replay is handled in-place via replaySignal so the
// same player just seeks to 0 and plays again.
function EpisodePlayer({ url, speed, replaySignal, onEnded }) {
  const player = useVideoPlayer(url, (p) => {
    p.playbackRate = speed;
  });

  // keep speed in sync when the user cycles it
  useEffect(() => {
    player.playbackRate = speed;
  }, [speed, player]);

  // replay current episode from the start (skip the initial mount so that
  // switching episodes via the Next button doesn't auto-play)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (replaySignal > 0) {
      player.currentTime = 0;
      player.play();
    }
  }, [replaySignal, player]);

  // auto-advance when the episode finishes
  useEvent(player, 'playToEnd', onEnded);

  return <VideoView player={player} nativeControls style={styles.video} />;
}

export default function PlayerScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { id, episode } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();

  const [ep, setEp] = useState(Number(episode) || 1);
  const [speed, setSpeed] = useState(1.0);
  const [replaySignal, setReplaySignal] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return dramas.find((d) => d.id === idNum);
  }, [id]);
  const maxEp = drama ? drama.episodes : 1;
  const locked = drama ? drama.premium && !unlocked : false;

  // Resolve the video URL from the remote catalog once it's loaded (or when the
  // episode changes). Falls back to a cached copy if the network is unavailable.
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    fetchCatalog().then(() => {
      if (!active) return;
      setVideoUrl(getVideoUrl(drama ? drama.id : id, ep) || null);
      setCatalogLoading(false);
    });
    return () => {
      active = false;
    };
  }, [drama, ep]);

  const watch = useCallback(
    (nextEp) => {
      if (drama.premium && !unlocked) {
        setPaywallVisible(true);
        return;
      }
      setEp(nextEp);
      addHistory(drama.id, nextEp);
    },
    [drama, unlocked, setPaywallVisible]
  );

  const onEnded = useCallback(() => {
    if (ep < maxEp) watch(ep + 1);
  }, [ep, maxEp, watch]);

  const replay = useCallback(() => setReplaySignal((n) => n + 1), []);
  const cycleSpeed = useCallback(
    () => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]),
    []
  );
  const next = () => {
    if (ep < maxEp) watch(ep + 1);
  };

  // Only mount the player when the episode is both unlocked and hosted.
  const showVideo = !locked && !!videoUrl;

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
        <Text style={[styles.epLabel, { color: colors.textMuted }]}>
          EP.{ep}/{drama ? drama.episodes : '?'}
        </Text>
      </View>

      <View style={styles.videoArea}>
        {locked ? (
          <TouchableOpacity style={styles.centerBtn} onPress={() => setPaywallVisible(true)}>
            <Text style={styles.lockBig}>🔒</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>解锁后观看</Text>
          </TouchableOpacity>
        ) : catalogLoading ? (
          <ActivityIndicator color="#D4AF37" />
        ) : showVideo ? (
          <EpisodePlayer
            key={ep}
            url={videoUrl}
            speed={speed}
            replaySignal={replaySignal}
            onEnded={onEnded}
          />
        ) : (
          <View style={styles.centerBtn}>
            <Text style={styles.lockBig}>🎬</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>该集即将上线</Text>
          </View>
        )}
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={replay} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>↻</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleSpeed} style={[styles.ctrl, styles.speedBtn]}>
            <Text style={styles.speedText}>{speed.toFixed(1)}x</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Speed</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} disabled={ep >= maxEp} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>⏭</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>Next EP.{ep + 1}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {drama ? drama.title : ''} · EP.{ep}
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
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: { flex: 1, width: '100%' },
  centerBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockBig: { fontSize: 48 },
  centerText: { fontSize: 13, marginTop: 12 },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.22)',
  },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  ctrl: { alignItems: 'center', minWidth: 64, opacity: 1 },
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
