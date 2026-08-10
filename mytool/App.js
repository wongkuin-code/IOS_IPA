import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl, ScrollView, Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIAP, ErrorCode, getAvailablePurchases } from 'expo-iap';
import * as api from './src/api';
import * as drama from './src/drama';
import { VIP_PRODUCT_ID, loadUnlockState, saveUnlockState, isVipPurchase } from './src/iap';

const COLORS = {
  bg: '#f5f0e8',
  card: '#ffffff',
  primary: '#8b5e3c',
  text: '#3a2f25',
  muted: '#8a7a68',
  border: '#e5dccb',
  gold: '#c9a227',
  danger: '#c0392b',
};

const LANGS = [
  { key: 'zh', label: '中文经典' },
  { key: 'en', label: 'English' },
];

const TOP_TABS = [
  { key: 'free', label: '📚 免费' },
  { key: 'short', label: '🎬 短剧' },
  { key: 'premium', label: '⭐ 精品' },
  { key: 'hot', label: '🔥 最火爆' },
];

const PREMIUM_PAGES = [1, 2, 3];
const SHORT_PAGES = [1, 2, 3, 4, 5];
const HOT_PAGES = [1, 2, 3, 4];

// ── IAP 诊断 ──
function fmtErr(e) {
  if (!e) return '未知错误（无详细信息）';
  if (typeof e === 'string') return e;
  const parts = [];
  if (e.code !== undefined && e.code !== null) {
    const name = typeof e.code === 'number' && ErrorCode[e.code] ? ErrorCode[e.code] : '';
    parts.push(`错误码: ${e.code}${name ? ` (${name})` : ''}`);
  }
  if (e.message) parts.push(`消息: ${e.message}`);
  if (e.userErrorMessage) parts.push(`详情: ${e.userErrorMessage}`);
  if (e.nativeErrorMessage) parts.push(`原生: ${e.nativeErrorMessage}`);
  if (!parts.length) parts.push(String(e));
  return parts.join('\n');
}

// ── 书架页 ──
function BookShelf({ tab, onTabChange, unlocked, onOpenBook }) {
  const insets = useSafeAreaInsets();
  const premium = tab === 'premium';
  const isShort = tab === 'short';
  const isHot = tab === 'hot';
  const locked = premium || isHot;
  const [lang, setLang] = useState('zh');
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef(1);

  const load = useCallback(async (nextPage, keyword, keepList) => {
    const p = nextPage || 1;
    try {
      if (isHot) {
        const pages = await Promise.all(HOT_PAGES.map(n => api.fetchBooks({ language: 'zh', page: n })));
        const rankMap = new Map(drama.HOT_RANK.map((id, i) => [id, i]));
        const merged = [];
        const seen = new Set();
        for (const d of pages) {
          for (const b of d.books) {
            if (!seen.has(b.id)) {
              seen.add(b.id);
              merged.push(b);
            }
          }
        }
        setBooks(
          merged
            .filter(b => rankMap.has(b.id))
            .sort((a, b) => rankMap.get(a.id) - rankMap.get(b.id))
            .map(b => ({ ...b, hotRank: rankMap.get(b.id) + 1, drama: drama.tagOf(b.id) })),
        );
        setHasMore(false);
        pageRef.current = 1;
        return;
      }
      if (isShort && !keyword) {
        const pages = await Promise.all(SHORT_PAGES.map(n => api.fetchBooks({ language: 'zh', page: n })));
        const merged = [];
        const seen = new Set();
        for (const d of pages) {
          for (const b of d.books) {
            if (!seen.has(b.id)) {
              seen.add(b.id);
              merged.push(b);
            }
          }
        }
        setBooks(merged.map(b => ({ ...b, drama: drama.tagOf(b.id) })));
        setHasMore(false);
        pageRef.current = 1;
        return;
      }
      if (premium && p === 1 && !keyword) {
        const pages = await Promise.all(
          PREMIUM_PAGES.map(n => api.fetchBooks({ language: lang, page: n })),
        );
        const merged = [];
        const seen = new Set();
        for (const d of pages) {
          for (const b of d.books) {
            if (!seen.has(b.id)) {
              seen.add(b.id);
              merged.push(b);
            }
          }
        }
        setBooks(merged.map(b => ({ ...b, drama: drama.tagOf(b.id) })));
        setHasMore(false);
        pageRef.current = 1;
      } else {
        const data = await api.fetchBooks({ language: isShort || isHot ? 'zh' : lang, search: keyword, page: p });
        const next = data.books.map(b => ({ ...b, drama: drama.tagOf(b.id) }));
        setBooks(keepList ? [...books, ...next] : next);
        setHasMore(data.hasMore);
        pageRef.current = p;
      }
    } catch (e) {
      setError(e.message);
      if (!keepList) setBooks([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [lang, premium, isShort, isHot, books]);

  useEffect(() => {
    setLoading(true);
    setError('');
    setSearch('');
    setGenre(null);
    pageRef.current = 1;
    load(1, '', false);
  }, [lang, premium, isShort, isHot]);

  const handleSearch = () => {
    setLoading(true);
    setError('');
    pageRef.current = 1;
    load(1, search, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(pageRef.current + 1, search, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    load(1, search, false);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <Text style={styles.header}>
        {isHot ? '🔥 最火爆' : isShort ? '🎬 短剧改编' : premium ? '⭐ 精品精选' : '📚 短剧小说'}
      </Text>
      <Text style={styles.subHeader}>
        {isHot
          ? (unlocked ? '短剧改编热度榜 TOP12 · 已解锁畅读' : '短剧改编热度榜 TOP12 · 需解锁畅读')
          : isShort
            ? '按短剧主流题材分类 · 每本附改编看点'
            : premium
              ? (unlocked ? '已解锁 · 畅读全部热门精品' : '热度榜精选 · 一次解锁永久阅读')
              : '阅读，让文化浸润生活'}
      </Text>

      <View style={styles.tabs}>
        {TOP_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => onTabChange(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isShort && !isHot && (
        <View style={styles.tabs}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[styles.tab, lang === l.key && styles.tabActive]}
              onPress={() => setLang(l.key)}
            >
              <Text style={[styles.tabText, lang === l.key && styles.tabTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={lang === 'zh' ? '搜索书名 / 作者' : 'Search title / author'}
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>

      {isShort && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
          <TouchableOpacity
            style={[styles.chip, genre === null && styles.chipActive]}
            onPress={() => setGenre(null)}
          >
            <Text style={[styles.chipText, genre === null && styles.chipTextActive]}>全部</Text>
          </TouchableOpacity>
          {drama.GENRE_KEYS.map(k => {
            const g = drama.DRAMA_GENRES[k];
            return (
              <TouchableOpacity
                key={k}
                style={[styles.chip, genre === k && { borderColor: g.color, backgroundColor: g.color }]}
                onPress={() => setGenre(k)}
              >
                <Text style={[styles.chipText, genre === k && styles.chipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {error ? (
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleSearch}>
            <Text style={styles.btnText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={genre ? books.filter(b => b.drama && b.drama.g === genre) : books}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            loading ? null : (
              <Text style={styles.countText}>
                {isHot
                  ? `🔥 短剧改编热榜 TOP${books.length} · ${unlocked ? '已解锁' : '需解锁'}`
                  : isShort
                    ? `共 ${books.length} 本 · 短剧改编书单（公共版权）`
                    : premium
                      ? `共 ${books.length} 本 · 精品精选${unlocked ? ' · 已解锁' : ' · 需解锁'}`
                      : `共 ${books.length} 本（公共版权 · 免费阅读）`}
              </Text>
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerBlock}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
              <Text style={styles.emptyText}>
                {isHot ? '暂无热榜数据' : isShort ? '该分类下暂无适合改编的书目' : premium ? '暂无精品内容' : '暂无书籍，换个关键词试试'}
              </Text>
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color={COLORS.primary} /> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.bookCard} onPress={() => onOpenBook(item, locked)}>
              {isHot ? (
                <View style={[styles.rankBadge, item.hotRank <= 3 && styles.rankBadgeTop]}>
                  <Text style={styles.rankBadgeText}>{item.hotRank}</Text>
                </View>
              ) : (
                <View style={styles.bookCover}>
                  <Text style={styles.bookCoverText}>📖</Text>
                </View>
              )}
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookDesc}>
                  {isHot ? `🔥 改编热度第 ${item.hotRank} 名 · ${item.downloads} 次下载` : `${item.downloads} 次下载`}
                </Text>
                {item.drama && (
                  <View style={styles.tagRow}>
                    <View style={[styles.genreBadge, { backgroundColor: drama.DRAMA_GENRES[item.drama.g].color }]}>
                      <Text style={styles.genreBadgeText}>{drama.DRAMA_GENRES[item.drama.g].label}</Text>
                    </View>
                    <Text style={styles.bookNote} numberOfLines={1}>{item.drama.note}</Text>
                  </View>
                )}
              </View>
              {locked && !unlocked ? (
                <View style={styles.vipBadge}><Text style={styles.vipBadgeText}>🔒 VIP</Text></View>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── 阅读器页 ──
function Reader({ book, onBack }) {
  const [content, setContent] = useState('');
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(17);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const text = await api.fetchBookText(book);
      const ps = api.paginate(text, 1500);
      setContent(text);
      setPages(ps);
      setPageIndex(0);
      if (ps.length === 0) setError('本书暂无正文内容');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => { load(); }, [load]);

  const goTo = (next) => {
    if (next < 0 || next >= pages.length) return;
    setPageIndex(next);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} />
      <View style={styles.readerTop}>
        <TouchableOpacity onPress={onBack} style={styles.readerBack}>
          <Text style={styles.back}>← 书架</Text>
        </TouchableOpacity>
        <View style={styles.readerMeta}>
          <Text style={styles.readerTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.readerAuthor} numberOfLines={1}>{book.author}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBlock}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : error ? (
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.btnText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentWrap}>
          <Text style={[styles.content, { fontSize }]}>{pages[pageIndex]}</Text>
        </ScrollView>
      )}

      {!loading && !error && (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.readerBarWrap}>
          <View style={styles.readerBar}>
          <TouchableOpacity
            style={[styles.pageBtn, pageIndex === 0 && styles.pageBtnDisabled]}
            disabled={pageIndex === 0}
            onPress={() => goTo(pageIndex - 1)}
          >
            <Text style={styles.pageBtnText}>上一页</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>{pageIndex + 1} / {pages.length}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, pageIndex >= pages.length - 1 && styles.pageBtnDisabled]}
            disabled={pageIndex >= pages.length - 1}
            onPress={() => goTo(pageIndex + 1)}
          >
            <Text style={styles.pageBtnText}>下一页</Text>
          </TouchableOpacity>
          <View style={styles.fontBtns}>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(Math.max(13, fontSize - 1))}>
              <Text style={styles.fontBtnText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(Math.min(26, fontSize + 1))}>
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

// ── 付费墙 ──
function Paywall({ visible, priceText, busy, onBuy, onRestore, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.paywallMask}>
        <View style={styles.paywallCard}>
          <Text style={styles.paywallIcon}>⭐</Text>
          <Text style={styles.paywallTitle}>解锁精品书库</Text>
          <Text style={styles.paywallDesc}>
            解锁全部热门精品书籍{'\n'}一次购买，永久有效，支持恢复购买
          </Text>
          <TouchableOpacity
            style={[styles.buyBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={onBuy}
          >
            <Text style={styles.buyBtnText}>{busy ? '处理中…' : `${priceText} 解锁全部`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.restoreBtn, busy && styles.btnDisabled]} disabled={busy} onPress={onRestore}>
            <Text style={styles.restoreText}>{busy ? '处理中…' : '恢复购买'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.paywallClose}>暂不</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [tab, setTab] = useState('free');
  const [currentBook, setCurrentBook] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallBusy, setPaywallBusy] = useState(false);
  const productsFetchedRef = useRef(false);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction, restorePurchases } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      console.log('[IAP] 购买成功', JSON.stringify(purchase && {
        productId: purchase.productId,
        purchaseState: purchase.purchaseState,
        transactionDate: purchase.transactionDate,
        originalTransactionDate: purchase.originalTransactionDate,
      }));
      await finishTransaction({ purchase, isConsumable: false });
      if (isVipPurchase(purchase)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallOpen(false);
        setPaywallBusy(false);
        Alert.alert('解锁成功', '精品书库已全部解锁');
      } else {
        console.warn('[IAP] 商品ID不匹配:', purchase && purchase.productId, '期望:', VIP_PRODUCT_ID);
        Alert.alert('商品ID不匹配', `已购买商品: ${purchase && purchase.productId}\n期望商品: ${VIP_PRODUCT_ID}\n后台配置的 ID 与代码不一致。`);
      }
    },
    onPurchaseError: (error) => {
      setPaywallBusy(false);
      console.warn('[IAP] 购买失败(回调):', error);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert('购买失败', fmtErr(error));
      }
    },
    onError: (error) => {
      setPaywallBusy(false);
      console.warn('[IAP] 商店错误:', error);
      Alert.alert('商店错误', fmtErr(error));
    },
  });

  useEffect(() => {
    loadUnlockState().then(setUnlocked);
  }, []);

  useEffect(() => {
    if (connected) {
      console.log('[IAP] 商店连接成功');
      fetchProducts({ skus: [VIP_PRODUCT_ID], type: 'in-app' })
        .then(() => {
          productsFetchedRef.current = true;
          console.log('[IAP] 商品查询完成，等待商品列表回调');
        })
        .catch(e => {
          console.warn('[IAP] 商品查询失败:', e);
          Alert.alert('商品查询失败', fmtErr(e));
        });
      getAvailablePurchases()
        .then(purchases => {
          console.log(`[IAP] 已有购买记录: ${purchases.length} 个`, purchases.map(p => p.productId));
          if (purchases.some(isVipPurchase)) {
            saveUnlockState();
            setUnlocked(true);
          }
        })
        .catch(e => {
          console.warn('[IAP] 查询已有购买记录失败:', e);
          Alert.alert('查询购买记录失败', fmtErr(e));
        });
    } else {
      console.warn('[IAP] 商店未连接');
    }
  }, [connected]);

  useEffect(() => {
    console.log(`[IAP] 商品列表回调: ${products.length} 个`,
      products.map(p => ({ id: p.id, price: p.localizedPrice, displayPrice: p.displayPrice })));
    if (productsFetchedRef.current && products.length === 0) {
      productsFetchedRef.current = false;
      Alert.alert('商品未配置',
        `后台取不到商品 ${VIP_PRODUCT_ID}（返回 0 个商品）。\n最常见原因：\n1) IAP 未提交审核通过(状态非 Approved)\n2) 该商品未覆盖当前 Apple 商店地区(价格/可用地区)或测试账号地区不对\n3) IAP 挂在别的 bundle id 的 App 下\n4) 用 Expo Go 测试(应改用 TestFlight/EAS 包)\n5) 付费协议未生效`);
    }
  }, [products]);

  const vipPrice = (() => {
    const p = products.find(x => x.id === VIP_PRODUCT_ID);
    return p && p.displayPrice ? p.displayPrice : '¥1';
  })();

  const openBook = (book, isPremium) => {
    if (isPremium && !unlocked) {
      setPaywallOpen(true);
      return;
    }
    setCurrentBook(book);
  };

  const handleBuy = async () => {
    if (!connected) {
      console.warn('[IAP] 商店未连接，无法购买');
      Alert.alert('商店不可用', '暂时无法连接 App Store（StoreKit 未连接）\n常见原因：付费协议未生效 / 审核中 / 用 Expo Go 测试');
      return;
    }
    setPaywallBusy(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: VIP_PRODUCT_ID },
          google: { skus: [VIP_PRODUCT_ID] },
        },
        type: 'in-app',
      });
    } catch (e) {
      setPaywallBusy(false);
      console.warn('[IAP] requestPurchase 抛错:', e);
      Alert.alert('购买失败', fmtErr(e));
    }
  };

  const handleRestore = async () => {
    setPaywallBusy(true);
    try {
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      console.log('[IAP] 恢复购买完成:', purchases.map(p => p.productId));
      if (purchases.some(isVipPurchase)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallOpen(false);
        Alert.alert('已恢复', '购买记录已恢复，精品书库已解锁');
      } else {
        Alert.alert('无购买记录', '未找到可恢复的购买记录');
      }
    } catch (e) {
      console.warn('[IAP] 恢复购买失败:', e);
      Alert.alert('恢复失败', fmtErr(e));
    } finally {
      setPaywallBusy(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        {currentBook ? (
          <Reader book={currentBook} onBack={() => setCurrentBook(null)} />
        ) : (
          <BookShelf
            tab={tab}
            onTabChange={setTab}
            unlocked={unlocked}
            onOpenBook={openBook}
          />
        )}
        <Paywall
          visible={paywallOpen}
          priceText={vipPrice}
          busy={paywallBusy}
          onBuy={handleBuy}
          onRestore={handleRestore}
          onClose={() => setPaywallOpen(false)}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subHeader: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 10, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.muted },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  searchRow: { flexDirection: 'row', marginBottom: 12 },
  searchInput: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: COLORS.text, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 24 },
  countText: { fontSize: 12, color: COLORS.muted, marginBottom: 10 },
  bookCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  bookCover: {
    width: 52, height: 70, borderRadius: 6, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bookCoverText: { fontSize: 26 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  bookAuthor: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  bookDesc: { fontSize: 12, color: COLORS.muted },
  chevron: { fontSize: 24, color: COLORS.muted, marginLeft: 8 },
  vipBadge: {
    backgroundColor: '#fff7e0', borderWidth: 1, borderColor: COLORS.gold,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8,
  },
  vipBadgeText: { fontSize: 12, color: COLORS.gold, fontWeight: '700' },
  chipRow: { flexGrow: 0, marginBottom: 12 },
  chipRowContent: { paddingRight: 4 },
  chip: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
    backgroundColor: COLORS.card,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  rankBadge: {
    width: 52, height: 70, borderRadius: 6, backgroundColor: '#3d3521',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rankBadgeTop: { backgroundColor: '#e8a33d' },
  rankBadgeText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  genreBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  genreBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  bookNote: { flex: 1, fontSize: 11, color: COLORS.muted },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
  errorText: { textAlign: 'center', color: COLORS.danger, marginBottom: 16, fontSize: 14 },
  retryBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  readerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  readerBack: { marginRight: 12 },
  back: { fontSize: 16, color: COLORS.primary },
  readerMeta: { flex: 1 },
  readerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  readerAuthor: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  contentWrap: { paddingBottom: 24 },
  content: { lineHeight: 30, color: COLORS.text },
  readerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  readerBarWrap: { backgroundColor: COLORS.bg },
  pageBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageIndicator: { fontSize: 13, color: COLORS.muted },
  fontBtns: { flexDirection: 'row' },
  fontBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6,
  },
  fontBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  paywallMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  paywallCard: {
    width: '82%', backgroundColor: COLORS.card, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  paywallIcon: { fontSize: 40, marginBottom: 8 },
  paywallTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  paywallDesc: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  buyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  buyBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  restoreBtn: { paddingVertical: 10 },
  restoreText: { color: COLORS.primary, fontSize: 14 },
  paywallClose: { color: COLORS.muted, fontSize: 13, paddingVertical: 10 },
  btnDisabled: { opacity: 0.5 },
});
