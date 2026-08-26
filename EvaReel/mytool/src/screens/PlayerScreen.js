// ── Player: real vertical 9:16 video via expo-video, premium-gated ──
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
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
function EpisodePlayer({ url, speed, replaySignal, onEnded, onRetry, onError, colors }) {
  const player = useVideoPlayer(url, (p) => {
    p.playbackRate = speed;
  });

  // Auto-play as soon as the source is attached (video taps into playback).
  useEffect(() => {
    player.play();
  }, [player]);

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

  // auto-advance when the episode finishes (event callback, not during render)
  useEffect(() => {
    const sub = player.addListener('playToEnd', onEnded);
    return () => sub.remove();
  }, [player, onEnded]);

  // Track playback state locally. Subscribe via addListener inside the effect
  // (event callbacks don't run during render) so that on Web, expo-video's
  // synchronous statusChange emit at init can't write back to the parent's
  // setState during render.
  const [status, setStatus] = useState(player.status);
  const [error, setError] = useState(player.error);
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status: s, error: e }) => {
      setStatus(s);
      setError(e);
      if (s === 'error' && onError) {
        onError(e && (e.message || String(e)));
      }
    });
    return () => sub.remove();
  }, [player, onError]);

  const loading = status === 'loading' || status === 'idle';

  return (
    <View style={{ flex: 1 }}>
      <VideoView player={player} nativeControls style={styles.video} />
      {loading && (
        <View style={styles.playerOverlay}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.playerOverlay}>
          <TouchableOpacity style={styles.centerBtn} onPress={onRetry}>
            <Text style={styles.lockBig}>⚠️</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>
              Video failed to load. Tap to retry
            </Text>
            {error ? (
              <Text style={[styles.errorDetail, { color: colors.textMuted }]}>
                {error.message || String(error)}
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
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
  const [remountKey, setRemountKey] = useState(0);
  const [playerError, setPlayerError] = useState(null);

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return dramas.find((d) => d.id === idNum);
  }, [id]);
  const maxEp = drama ? drama.episodes : 1;
  // If a video URL is available (incl. catalog fallback to the one real video),
  // it can play — no longer gated by the `available` flag.
  const hasVideo = !!videoUrl;
  const unavailable = drama ? !drama.available && !hasVideo : false;
  const locked = (drama ? drama.premium && !unlocked : false) || unavailable;

  // Reload the video URL from the catalog. Always fetch fresh (force) so a stale
  // cached catalog can never leave the player stuck on "coming soon".
  const reload = useCallback(() => {
    let active = true;
    setCatalogLoading(true);
    fetchCatalog({ force: true })
      .then(() => {
        if (!active) return;
        setVideoUrl(getVideoUrl(drama ? drama.id : id, ep) || null);
        setCatalogLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [drama, id, ep]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  const watch = useCallback(
    (nextEp) => {
      if (!drama.available) {
        return;
      }
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

  // Retry: re-fetch the catalog and force the player to remount with a fresh
  // source so transient network/codec errors are cleared.
  const retry = useCallback(() => {
    setPlayerError(null);
    setRemountKey((k) => k + 1);
    reload();
  }, [reload]);

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
            <Text style={[styles.centerText, { color: colors.textMuted }]}>Unlock to watch</Text>
          </TouchableOpacity>
        ) : catalogLoading ? (
          <ActivityIndicator color="#D4AF37" />
        ) : unavailable ? (
          <View style={styles.centerBtn}>
            <Text style={styles.lockBig}>🚧</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>This content is not open yet. Stay tuned</Text>
          </View>
        ) : showVideo ? (
          <EpisodePlayer
            key={`${ep}-${remountKey}`}
            url={videoUrl}
            speed={speed}
            replaySignal={replaySignal}
            onEnded={onEnded}
            onRetry={retry}
            onError={setPlayerError}
            colors={colors}
          />
        ) : drama && drama.available ? (
          <TouchableOpacity style={styles.centerBtn} onPress={retry}>
            <Text style={styles.lockBig}>⚠️</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>Video failed to load. Tap to retry</Text>
            {playerError ? (
              <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{playerError}</Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <View style={styles.centerBtn}>
            <Text style={styles.lockBig}>🎬</Text>
            <Text style={[styles.centerText, { color: colors.textMuted }]}>This episode is coming soon</Text>
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
  playerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  errorDetail: { fontSize: 11, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
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
