// ── Home: TikTok-style full-screen video feed — one video per page, swipe up snaps next ──
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';

import CoverImage from '../components/CoverImage';
import { dramaTheme } from '../components/DramaCover';
import { useCatalogue, getDramas, dailyPicks } from '../data/catalogue';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { unlocked, setPaywallVisible } = useUnlock();
  const all = useCatalogue();

  const [activeIndex, setActiveIndex] = useState(0);
  // 页高必须等于 FlatList 自己的视口高度（不是 useWindowDimensions，也不是
  // 外层 root —— 底部 Tab 栏会占掉一段，拍脑袋的页高会让 pagingEnabled 按
  // 错误步长翻页，进而把居中播放按钮顶到视口上方）。直接从 FlatList 的
  // onLayout 量一个，保证 cell height === 视口高度，永远一致。
  const [listH, setListH] = useState(0);
  const onListLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setListH(h);
  }, []);

  // 竖屏(手机/iOS)用 cover 全屏铺满；横屏(web 桌面)用 contain 保证人物完整
  const contentFit = height >= width ? 'cover' : 'contain';

  // 每个 item 高度 === FlatList 视口高度 → 每个视频一样大、每次滑动正好一屏
  const pageHeight = listH > 0 ? listH : height;
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const lastSnapAt = useRef(0);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  const feed = useMemo(() => buildFeed(all), [all]);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(getDramas().filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, all]);

  // TikTok snap: always land exactly on a page, springy but decisive.
  // Native `pagingEnabled` already gives this exact feel on iOS, so the manual
  // snap is only needed on web where native paging is unreliable.
  const snapToPage = useCallback(
    (page) => {
      if (Platform.OS !== 'web') return;
      const clamped = Math.max(0, Math.min(feed.length - 1, page));
      setActiveIndex(clamped);
      const target = clamped * pageHeight;
      if (Math.abs(offsetRef.current - target) > 1) {
        listRef.current?.scrollToOffset({ offset: target, animated: true });
      }
    },
    [feed.length, pageHeight]
  );

  // Decide the target page from the resting offset + flick velocity, then snap.
  const handleScrollEnd = useCallback(
    (e) => {
      if (Platform.OS !== 'web') return;
      const now = Date.now();
      if (now - lastSnapAt.current < 60) return; // dedupe drag/momentum events
      lastSnapAt.current = now;
      const offset = e.nativeEvent?.contentOffset?.y ?? offsetRef.current;
      const velocity = e.nativeEvent?.velocity?.y ?? 0;
      const base = Math.round(offset / pageHeight);
      let page = base;
      // A strong flick always moves one page in the direction of travel,
      // even if the user barely dragged — just like TikTok.
      if (velocity < -0.3) page = Math.floor(offset / pageHeight) + 1;
      else if (velocity > 0.3) page = Math.ceil(offset / pageHeight) - 1;
      snapToPage(page);
    },
    [pageHeight, snapToPage]
  );

  const onScroll = useCallback((e) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onViewabilityConfigChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length) {
      const top = viewableItems[0].index;
      if (typeof top === 'number' && top !== activeIndexRef.current) setActiveIndex(top);
    }
  }).current;

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const openDetail = useMemo(
    () => (drama) => navigation.navigate('DramaDetail', { id: drama.id }),
    [navigation]
  );

  const unlockOrOpen = useCallback(
    (drama) => {
      if (!unlocked && lockedIds.has(drama.id)) {
        setPaywallVisible(true);
        return;
      }
      openDetail(drama);
    },
    [unlocked, lockedIds, setPaywallVisible, openDetail]
  );

  const playFirst = useCallback(
    (drama) => {
      if (drama.premium && !unlocked) {
        setPaywallVisible(true);
        return;
      }
      navigation.navigate('Player', { id: drama.id, episode: 1 });
    },
    [navigation, unlocked, setPaywallVisible]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TikTokCell
        drama={item}
        height={pageHeight}
        contentFit={contentFit}
        locked={lockedIds.has(item.id)}
        onDetail={() => openDetail(item)}
        onMore={() => unlockOrOpen(item)}
        onPlay={() => playFirst(item)}
      />
    ),
    [pageHeight, contentFit, lockedIds, openDetail, unlockOrOpen, playFirst]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBarDark />
      <FlatList
        ref={listRef}
        style={StyleSheet.absoluteFill}
        onLayout={onListLayout}
        data={feed}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        // iOS: native pagingEnabled gives the exact "lock to one full-screen
        // page" feel like TikTok. Web: pagingEnabled is unreliable, so we
        // manually snap in handleScrollEnd instead (see snapToPage).
        pagingEnabled={Platform.OS !== 'web'}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewabilityConfigChanged}
        getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
        removeClippedSubviews={false}
        initialNumToRender={2}
        windowSize={5}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.brandRow}>
          <LinearGradient
            colors={[colors.goldLight, colors.goldDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Ionicons name="play" size={15} color="#200B06" />
          </LinearGradient>
          <Text style={[styles.brand, { color: '#fff' }]}>
            Eva<Text style={{ color: colors.gold }}>Short</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

function buildFeed(list) {
  const pool = list && list.length ? list : getDramas();
  const picks = dailyPicks();
  const seen = new Set(picks.map((d) => d.id));
  const rest = pool.filter((d) => !seen.has(d.id));
  // 不写固定上限：轮播范围 = 服务器返回的全部视频数量
  return [...picks, ...rest];
}

function TikTokCell({ drama, height, contentFit, locked, onDetail, onMore, onPlay }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const src = useMemo(() => {
    const eps = drama.episodeVideos;
    if (eps && eps.length) return eps[0];
    return drama.videoUrl || null;
  }, [drama]);

  const player = useVideoPlayer(src, (p) => {
    p.loop = true;
    p.muted = true; // 首页静音封面；进播放器才出声
    p.playbackRate = 1.0;
  });

  // 首页不自动播放：仅加载并停在首帧当封面。
  useEffect(() => {
    if (!src) return;
    player.pause();
  }, [src, player]);

  // 视频就绪后停在第 1 帧附近，避免显示首帧前是黑屏。
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay' && src) {
      player.currentTime = 0.02;
    }
  });

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      {src ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit={contentFit}
          nativeControls={false}
          playsInline
        />
      ) : (
        <CoverImage
          asset={drama.asset}
          fallback={<LinearGradient colors={dramaTheme(drama.id)} style={StyleSheet.absoluteFill} />}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Tap the video to open the full player (unlock-gated for premium) */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onPlay}
      />

      {/* 起播按钮：不靠 flex 撑垂直居中——cell height===视口高度，直接按
          (height-64)/2 用像素定死正中，任何安全区/页高差异都不会再把它顶开。 */}
      <View style={[styles.centerPlay, { top: (height - CENTER_PLAY_SIZE) / 2 }]} pointerEvents="none">
        <View style={styles.centerPlayBadge}>
          <Ionicons name="play" size={30} color="#fff" />
        </View>
      </View>

      {/* Right action rail (TikTok-style like/save/unlock buttons) */}
      <View style={[styles.rail, { bottom: insets.bottom + 28 }]}>
        <RailButton icon="heart-outline" label="Like" onPress={onDetail} />
        <RailButton icon="chatbubble-ellipses-outline" label="Detail" onPress={onDetail} />
        <RailButton
          icon={locked ? 'lock-open-outline' : 'play'}
          label={locked ? 'Unlock' : 'Play'}
          onPress={onPlay}
        />
        <RailButton icon="ellipsis-horizontal" label="More" onPress={onMore} />
      </View>

      {/* Bottom-left info card */}
      <View style={[styles.cardBody, { paddingBottom: 18 }]} pointerEvents="none">
        {locked ? (
          <Text style={[styles.lockChip, { borderColor: colors.gold, color: colors.goldLight }]}>
            🔒 PREMIUM
          </Text>
        ) : (
          <Text style={[styles.chip, { color: colors.goldLight }]}>
            {drama.category[0].toUpperCase()} · EP.{drama.episodes} · ⭐ {drama.rating.toFixed(1)}
          </Text>
        )}
        <Text style={[styles.title, { color: '#fff' }]} numberOfLines={2}>
          {drama.title}
        </Text>
        <Text style={[styles.meta, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>
          {drama.subtitle}
        </Text>
        <Text style={[styles.swipeHint, { color: 'rgba(255,255,255,0.7)' }]}>
          {locked ? 'Unlock to watch full episodes' : 'Swipe up for next'}
        </Text>
      </View>
    </View>
  );
}

function RailButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.railBtn} activeOpacity={0.8}>
      <Ionicons name={icon} size={30} color="#fff" />
      <Text style={styles.railLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const CENTER_PLAY_SIZE = 64;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brand: { fontSize: 24, letterSpacing: 0.5, fontWeight: '800' },
  cardBody: {
    position: 'absolute',
    left: 16,
    right: 96,
    bottom: 0,
  },
  chip: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 },
  lockChip: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  title: { fontSize: 26, lineHeight: 31, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  swipeHint: { fontSize: 11, marginTop: 10, letterSpacing: 0.4 },
  rail: { position: 'absolute', right: 12, alignItems: 'center' },
  railBtn: { alignItems: 'center', marginBottom: 20 },
  railLabel: { color: '#fff', fontSize: 11, marginTop: 4 },
  centerPlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerPlayBadge: {
    width: CENTER_PLAY_SIZE,
    height: CENTER_PLAY_SIZE,
    borderRadius: CENTER_PLAY_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
