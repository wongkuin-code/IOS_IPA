// ── Player: real video playback via expo-video (iOS + Web) ──
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import { useAuth } from '../auth/AuthContext';
import { api, getToken } from '../api/client';
import StatusBarDark from '../components/StatusBarDark';
import { dramaTheme } from '../components/DramaCover';
import { useCatalogue, getDramas, episodeTitle, loadVideoDetail } from '../data/catalogue';
import { addHistory } from '../data/libraryStore';

const SPEEDS = [0.5, 1.0, 1.5, 2.0];

export default function PlayerScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { id, episode } = route.params || {};
  const { unlocked, setPaywallVisible } = useUnlock();
  const { user } = useAuth();
  const isGuest = Boolean(user && user.isGuest);
  const [ep, setEp] = useState(Number(episode) || 1);
  const [speed, setSpeed] = useState(1.0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [episodePicker, setEpisodePicker] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState(null);
  const all = useCatalogue();

  const drama = useMemo(() => {
    const idNum = Number(String(id).replace(/-r$/, ''));
    return getDramas().find((d) => d.id === idNum);
  }, [id, all]);

  // Make sure the full episode videoUrls are loaded before playback.
  useEffect(() => {
    if (drama) loadVideoDetail(drama.id);
  }, [drama]);

  // Current episode video source (real, server/local-hosted mp4).
  const src = useMemo(() => {
    if (!drama) return null;
    const eps = drama.episodeVideos;
    if (eps && eps.length) return eps[(ep - 1) % eps.length];
    return drama.videoUrl || null;
  }, [drama, ep]);
  const hasVideo = Boolean(src);

  const playingRef = useRef(playing);
  playingRef.current = playing;

  const player = useVideoPlayer(hasVideo ? src : null, (p) => {
    p.loop = false;
    p.playbackRate = 1.0;
    p.muted = false;
    p.timeUpdateEventInterval = 0.25; // drive the progress bar
  });

  // Replace source when episode / url changes, then resume if intended to play.
  useEffect(() => {
    if (!hasVideo) return;
    let cancelled = false;
    player.replaceAsync(src).then(() => {
      if (!cancelled && playingRef.current) player.play();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, hasVideo]);

  // Sync play/pause intent with the player.
  useEffect(() => {
    if (!hasVideo) return;
    if (playing) player.play();
    else player.pause();
  }, [playing, hasVideo, player]);

  // Keep playback rate in sync.
  useEffect(() => {
    player.playbackRate = speed;
  }, [speed, player]);

  // Keep mute state in sync (default audible on entry).
  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  // Progress (expo-video emits timeUpdate only while playing / loaded).
  useEventListener(player, 'timeUpdate', ({ currentTime, duration: d }) => {
    setElapsed(currentTime);
    if (d) setDuration(d);
  });

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const finished = duration > 0 && elapsed >= duration - 0.3;

  // Episode finished → advance to next automatically.
  useEventListener(player, 'playToEnd', () => {
    if (!drama) return;
    if (ep < drama.episodes) {
      const t = setTimeout(() => watch(ep + 1), 1200);
      return () => clearTimeout(t);
    }
    setPlaying(false);
  });

  const watch = useCallback(
    async (nextEp) => {
      if (!drama) return;
      if (drama.premium && !unlocked) {
        setPaywallVisible(true);
        return;
      }
      if (isGuest) {
        const token = await getToken();
        const r = await api
          .post('/user/watch', { dramaId: drama.id, episode: nextEp }, token)
          .catch(() => null);
        if (r && !r.allowed) {
          setQuotaLimit(0);
          setPlaying(false);
          return;
        }
        if (r && r.limit) setQuotaLimit(r.limit - r.used);
      }
      setEp(nextEp);
      setElapsed(0);
      setPlaying(true);
      addHistory(drama.id, nextEp);
    },
    [drama, unlocked, setPaywallVisible, isGuest]
  );

  if (!drama) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  const nextEp = ep < drama.episodes ? ep + 1 : null;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: '#000', paddingTop: insets.top }]}>
      <StatusBarDark />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={[styles.title, fonts.display, { color: colors.text }]} numberOfLines={1}>
            {drama.title}
          </Text>
          <Text style={[styles.episodeTitle, { color: colors.textMuted }]} numberOfLines={1}>
            {episodeTitle(drama, ep)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setEpisodePicker(true)} style={styles.epBtn}>
          <Text style={[styles.epLabel, { color: colors.gold }]}>EP.{ep}/{drama.episodes} ▾</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['rgba(8,8,12,0.92)', 'rgba(8,8,12,0.55)', '#08080C']}
        style={styles.videoArea}
      >
        {hasVideo ? (
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <LinearGradient
            colors={dramaTheme(drama.id)}
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>No video available</Text>
          </LinearGradient>
        )}
        <TouchableOpacity
          style={styles.playBig}
          onPress={() => {
            if (finished) {
              player.currentTime = 0;
              setElapsed(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
        >
          <Text style={styles.playBigText}>
            {finished ? '↻' : playing ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.mockHint, { color: colors.textMuted }]}>
          {finished
            ? 'Episode complete'
            : hasVideo
              ? playing
                ? `Now Playing · EP.${ep} · ${fmt(Math.max(0, duration - elapsed))} left`
                : 'Tap to play'
              : 'No video available'}
        </Text>
      </LinearGradient>

      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.gold }]} />
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={() => {
              player.currentTime = 0;
              setElapsed(0);
              setPlaying(true);
            }}
            style={styles.ctrl}
          >
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
          <TouchableOpacity onPress={() => nextEp && watch(nextEp)} disabled={!nextEp} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>⏭</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>
              {nextEp ? `Next EP.${nextEp}` : 'Last Episode'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMuted((m) => !m)} style={styles.ctrl}>
            <Text style={styles.ctrlIcon}>{muted ? '🔇' : '🔊'}</Text>
            <Text style={[styles.ctrlLabel, { color: colors.textMuted }]}>
              {muted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {nextEp ? `Up next: ${episodeTitle(drama, nextEp)}` : 'You reached the finale — thanks for watching!'}
        </Text>
        {isGuest && quotaLimit !== null ? (
          <Text style={[styles.guestHint, { color: colors.textMuted }]}>
            Guest previews left today: {quotaLimit}
          </Text>
        ) : null}
      </View>

      <Modal visible={quotaLimit === 0} transparent animationType="fade" onRequestClose={() => setQuotaLimit(null)}>
        <View style={styles.pickerMask}>
          <View style={[styles.limitCard, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
            <Text style={styles.limitIcon}>🎭</Text>
            <Text style={[styles.limitTitle, fonts.display, { color: colors.text }]}>Guest Preview Limit</Text>
            <Text style={[styles.limitDesc, { color: colors.textMuted }]}>
              You've used all free guest previews for today. Log in or create an account for unlimited watching.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setQuotaLimit(null);
                navigation.navigate('EditProfile');
              }}
              style={[styles.limitBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={styles.limitBtnText}>Upgrade / Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQuotaLimit(null)} style={styles.pickerClose}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={episodePicker} transparent animationType="fade" onRequestClose={() => setEpisodePicker(false)}>
        <View style={styles.pickerMask}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Episode</Text>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerGrid}>
                {Array.from({ length: drama.episodes }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => {
                      setEpisodePicker(false);
                      watch(n);
                    }}
                    style={[
                      styles.pickerCell,
                      { backgroundColor: colors.background },
                      n === ep && { borderColor: colors.gold, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.pickerNum, { color: n === ep ? colors.gold : colors.text }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={() => setEpisodePicker(false)} style={styles.pickerClose}>
              <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 32, alignItems: 'center' },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  titleCol: { flex: 1, marginHorizontal: 8 },
  title: { fontSize: 16 },
  episodeTitle: { fontSize: 11, marginTop: 1 },
  epBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,77,46,0.12)' },
  epLabel: { fontSize: 13, fontWeight: '800' },
  videoArea: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 9 / 16,
    alignSelf: 'center',
  },
  playBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,77,46,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBigText: { color: '#200B06', fontSize: 28, marginLeft: 3 },
  mockHint: { fontSize: 12, marginTop: 12 },
  sheet: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,77,46,0.22)' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  ctrl: { alignItems: 'center', minWidth: 64 },
  ctrlIcon: { fontSize: 22, color: '#fff' },
  ctrlLabel: { fontSize: 11, marginTop: 4 },
  speedBtn: { backgroundColor: 'rgba(255,77,46,0.15)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  speedText: { color: '#FF9A3C', fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 16 },
  pickerMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  pickerCard: { width: '100%', maxHeight: '70%', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255,77,46,0.3)' },
  pickerTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  pickerList: { flexGrow: 0 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerCell: { width: 52, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', margin: 4 },
  pickerNum: { fontSize: 14, fontWeight: '700' },
  pickerClose: { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
  limitCard: { width: '100%', borderRadius: 18, padding: 24, alignItems: 'center', borderWidth: 1 },
  limitIcon: { fontSize: 40, marginBottom: 8 },
  limitTitle: { fontSize: 22, textAlign: 'center' },
  limitDesc: { fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  limitBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, borderRadius: 999, marginTop: 20 },
  limitBtnText: { color: '#200B06', fontWeight: '800', fontSize: 15 },
  guestHint: { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
