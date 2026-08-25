// ── Home: vertical paging feed (ReelShort-style) — full-bleed card per page ──
import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUnlock } from '../iap/UnlockContext';
import StatusBarDark from '../components/StatusBarDark';
import SearchButton from '../components/SearchButton';
import CoverImage from '../components/CoverImage';
import { dramaTheme } from '../components/DramaCover';
import { useCatalogue, getDramas, dailyPicks } from '../data/catalogue';

const HEADER_PADDING = 64;

export default function HomeScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { unlocked, setPaywallVisible } = useUnlock();
  const [listHeight, setListHeight] = useState(null);
  const all = useCatalogue();

  const pageHeight = listHeight || Math.max(300, height - insets.top - HEADER_PADDING);

  const feed = useMemo(() => buildFeed(all), [all]);

  const lockedIds = useMemo(() => {
    if (unlocked) return new Set();
    return new Set(getDramas().filter((d) => d.premium).map((d) => d.id));
  }, [unlocked, all]);

  const openDetail = useMemo(
    () => (drama) => navigation.navigate('DramaDetail', { id: drama.id }),
    [navigation]
  );

  const playEpisode = useMemo(
    () => (drama, episode) => {
      if (drama.premium && !unlocked) {
        setPaywallVisible(true);
        return;
      }
      navigation.navigate('Player', { id: drama.id, episode });
    },
    [navigation, unlocked, setPaywallVisible]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <FeedCard
        drama={item}
        width={width}
        height={pageHeight}
        locked={lockedIds.has(item.id)}
        onPlay={() => playEpisode(item, 1)}
        onEp={playEpisode}
        onDetail={() => openDetail(item)}
      />
    ),
    [width, pageHeight, lockedIds, playEpisode, openDetail]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <LinearGradient
              colors={[colors.goldLight, colors.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Ionicons name="play" size={15} color="#200B06" />
            </LinearGradient>
            <Text style={[styles.brand, { color: colors.text }]}>
              Eva<Text style={{ color: colors.gold }}>Short</Text>
            </Text>
          </View>
          <SearchButton onPress={() => navigation.navigate('Discover')} />
        </View>
      </View>
      <FlatList
        data={feed}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={pageHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
        removeClippedSubviews={false}
        initialNumToRender={3}
        windowSize={5}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
      />
    </View>
  );
}

function buildFeed(list) {
  const pool = list && list.length ? list : getDramas();
  const picks = dailyPicks();
  const seen = new Set(picks.map((d) => d.id));
  const rest = pool.filter((d) => !seen.has(d.id));
  return [...picks, ...rest].slice(0, 12);
}

function FeedCard({ drama, width, height, locked, onPlay, onEp, onDetail }) {
  const { colors, fonts } = useTheme();
  const episodes = Array.from({ length: Math.min(5, drama.episodes) }, (_, i) => i + 1);
  return (
    <View style={{ width, height }}>
      <CoverImage
        asset={drama.asset}
        fallback={<LinearGradient colors={dramaTheme(drama.id)} style={StyleSheet.absoluteFill} />}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(13,13,18,0)', 'rgba(13,13,18,0.45)', '#0D0D12']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardBody}>
        <Text style={[styles.chip, { color: colors.goldLight }]}>
          {drama.category[0].toUpperCase()} · EP.{drama.episodes} · ⭐ {drama.rating.toFixed(1)}
        </Text>
        <Text style={[styles.title, fonts.display, { color: colors.text }]} numberOfLines={2}>
          {drama.title}
        </Text>
        <Text style={[styles.subtitle, fonts.displayMedium, { color: colors.textMuted }]} numberOfLines={1}>
          {drama.subtitle}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {drama.year} · {drama.status} · {(drama.tags || []).slice(0, 2).map((t) => `#${t}`).join(' ')}
        </Text>

        <View style={styles.epRow}>
          {episodes.map((ep) => (
            <TouchableOpacity key={ep} onPress={() => onEp(drama, ep)} style={[styles.epCell, { borderColor: colors.borderGold }]}>
              <Text style={[styles.epNum, { color: locked ? colors.textMuted : colors.text }]}>{locked ? '🔒' : `EP.${ep}`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity onPress={onPlay} style={styles.playWrap} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.goldLight, colors.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playBtn}
            >
              <Text style={styles.playText}>{locked ? '🔒 Watch' : '▶ Play'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDetail} style={[styles.detailBtn, { borderColor: colors.border }]} activeOpacity={0.85}>
            <Text style={[styles.detailText, { color: colors.text }]}>Details</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>Swipe up for more</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brand: { fontSize: 24, letterSpacing: 0.5 },
  cardBody: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingBottom: 18 },
  chip: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 },
  title: { fontSize: 27, lineHeight: 32 },
  subtitle: { fontSize: 16, marginTop: 4 },
  meta: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  epRow: { flexDirection: 'row', marginTop: 14 },
  epCell: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  epNum: { fontSize: 12, fontWeight: '700' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  playWrap: { flex: 1.6, marginRight: 10 },
  playBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
  },
  playText: { color: '#200B06', fontSize: 16, fontWeight: '800' },
  detailBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  detailText: { fontSize: 15, fontWeight: '700' },
  swipeHint: { fontSize: 11, textAlign: 'center', marginTop: 14, letterSpacing: 0.4 },
});
