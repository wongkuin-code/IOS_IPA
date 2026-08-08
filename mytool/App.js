import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl, ScrollView, Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIAP, ErrorCode, getAvailablePurchases } from 'expo-iap';
import * as api from './src/api';
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
  { key: 'premium', label: '⭐ 精品' },
];

const PREMIUM_PAGES = [1, 2, 3];

// ── 书架页 ──
function BookShelf({ tab, onTabChange, unlocked, onOpenBook }) {
  const insets = useSafeAreaInsets();
  const premium = tab === 'premium';
  const [lang, setLang] = useState('zh');
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
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
        setBooks(merged);
        setHasMore(false);
        pageRef.current = 1;
      } else {
        const data = await api.fetchBooks({ language: lang, search: keyword, page: p });
        setBooks(keepList ? [...books, ...data.books] : data.books);
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
  }, [lang, premium, books]);

  useEffect(() => {
    setLoading(true);
    setError('');
    setSearch('');
    pageRef.current = 1;
    load(1, '', false);
  }, [lang, premium]);

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
      <Text style={styles.header}>{premium ? '⭐ 精品精选' : '📚 短剧小说'}</Text>
      <Text style={styles.subHeader}>
        {premium
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

      {error ? (
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleSearch}>
            <Text style={styles.btnText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            loading ? null : (
              <Text style={styles.countText}>
                {premium
                  ? `共 ${books.length} 本 · 精品精选${unlocked ? ' · 已解锁' : ' · 需解锁'}`
                  : `共 ${books.length} 本（公共版权 · 免费阅读）`}
              </Text>
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerBlock}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
              <Text style={styles.emptyText}>{premium ? '暂无精品内容' : '暂无书籍，换个关键词试试'}</Text>
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color={COLORS.primary} /> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.bookCard} onPress={() => onOpenBook(item, premium)}>
              <View style={styles.bookCover}>
                <Text style={styles.bookCoverText}>📖</Text>
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookDesc}>{item.downloads} 次下载</Text>
              </View>
              {premium && !unlocked ? (
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

  const { connected, products, fetchProducts, requestPurchase, finishTransaction, restorePurchases } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({ purchase, isConsumable: false });
      if (isVipPurchase(purchase)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallOpen(false);
        setPaywallBusy(false);
        Alert.alert('解锁成功', '精品书库已全部解锁');
      }
    },
    onPurchaseError: (error) => {
      setPaywallBusy(false);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert('购买失败', error.message || '请稍后再试');
      }
    },
    onError: () => {
      setPaywallBusy(false);
    },
  });

  useEffect(() => {
    loadUnlockState().then(setUnlocked);
  }, []);

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: [VIP_PRODUCT_ID], type: 'in-app' }).catch(() => {});
      getAvailablePurchases()
        .then(purchases => {
          if (purchases.some(isVipPurchase)) {
            saveUnlockState();
            setUnlocked(true);
          }
        })
        .catch(() => {});
    }
  }, [connected]);

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
      Alert.alert('商店不可用', '暂时无法连接 App Store，请稍后再试');
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
      Alert.alert('购买失败', e.message || '请稍后再试');
    }
  };

  const handleRestore = async () => {
    setPaywallBusy(true);
    try {
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      if (purchases.some(isVipPurchase)) {
        await saveUnlockState();
        setUnlocked(true);
        setPaywallOpen(false);
        Alert.alert('已恢复', '购买记录已恢复，精品书库已解锁');
      } else {
        Alert.alert('无购买记录', '未找到可恢复的购买记录');
      }
    } catch (e) {
      Alert.alert('恢复失败', e.message || '请稍后再试');
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
