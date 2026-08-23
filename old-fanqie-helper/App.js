import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  FlatList, Alert, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import * as fanqie from './src/fanqie';
import * as storage from './src/storage';

// ── 颜色 ──
const C = {
  bg: '#0e1117',
  card: '#1a1d23',
  primary: '#ff4b4b',
  text: '#f0f0f0',
  muted: '#666',
  border: '#2a2d33',
  success: '#4caf50',
  warning: '#ff9800',
};

// ── 工具 ──
function parseChapterTitle(title) {
  const m = title.match(/^第(\d+)章/);
  return m ? parseInt(m[1]) : 0;
}

function textToHtml(text) {
  return text.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
}

// ── 登录页面 ──
function LoginScreen({ onLogin }) {
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState('');
  const [cookie, setCookie] = useState('');
  const [csrf, setCsrf] = useState('');

  useEffect(() => {
    storage.listAccounts().then(setAccounts);
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !cookie.trim()) {
      Alert.alert('错误', '账号名称和 Cookie 不能为空');
      return;
    }
    await storage.saveAccount(name.trim(), cookie.trim(), csrf.trim());
    Alert.alert('成功', `账号「${name.trim()}」已保存`);
    setAccounts(await storage.listAccounts());
  };

  const handleLogin = async (accName) => {
    const creds = await storage.getCredentials(accName);
    if (!creds.cookie) { Alert.alert('错误', '该账号无凭证'); return; }
    try {
      const books = await fanqie.listBooks(creds.cookie, creds.csrf);
      onLogin(accName, creds, books);
    } catch (e) {
      Alert.alert('登录失败', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.center}>
      <Text style={styles.title}>🍅 番茄助手</Text>
      <Text style={styles.subtitle}>手机端小说上传工具</Text>

      <Text style={styles.sectionTitle}>已保存账号</Text>
      {accounts.length === 0 && <Text style={styles.muted}>暂无账号</Text>}
      {accounts.map(acc => (
        <TouchableOpacity key={acc} style={styles.btn} onPress={() => handleLogin(acc)}>
          <Text style={styles.btnText}>登录 {acc}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>新账号</Text>
      <TextInput style={styles.input} placeholder="账号名称" placeholderTextColor={C.muted}
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Cookie（从浏览器复制）" placeholderTextColor={C.muted}
        value={cookie} onChangeText={setCookie} multiline />
      <TextInput style={styles.input} placeholder="X-Secsdk-Csrf-Token（可选）" placeholderTextColor={C.muted}
        value={csrf} onChangeText={setCsrf} />
      <TouchableOpacity style={[styles.btn, { backgroundColor: C.warning }]} onPress={handleSave}>
        <Text style={styles.btnText}>保存凭证</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── 书籍列表页面 ──
function BooksScreen({ books, creds, accountName, onSelectBook, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const b = await fanqie.listBooks(creds.cookie, creds.csrf);
      onRefresh(b);
    } catch (e) { Alert.alert('刷新失败', e.message); }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 我的小说</Text>
      <Text style={styles.muted}>账号: {accountName}</Text>
      <FlatList
        data={books}
        keyExtractor={(item) => String(item.book_id || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelectBook(item)}>
            <Text style={styles.cardTitle}>{item.book_name || item.name}</Text>
            <Text style={styles.muted}>ID: {item.book_id || item.id}</Text>
            <Text style={styles.muted}>{item.word_count || 0} 字</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.muted}>暂无书籍</Text>}
      />
    </View>
  );
}

// ── 章节列表页面 ──
function ChaptersScreen({ bookId, bookName, creds, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');

  const loadChapters = useCallback(async () => {
    setLoading(true);
    try {
      const vols = await fanqie.listVolumes(bookId, creds.cookie, creds.csrf);
      if (vols.length === 0) { setChapters([]); return; }
      const chs = await fanqie.listChapters(bookId, vols[0].volume_id, creds.cookie, creds.csrf);
      setChapters(chs.map(c => ({ ...c, index: parseInt(c.index || c.chapter_index || 0) })));
    } catch (e) { Alert.alert('获取章节失败', e.message); }
    setLoading(false);
  }, [bookId, creds]);

  useEffect(() => { loadChapters(); }, [loadChapters]);

  const handleUpload = async (ch) => {
    if (!content.trim()) { Alert.alert('错误', '请输入章节内容'); return; }
    try {
      const title = ch.title;
      const html = textToHtml(content.trim());
      const itemId = await fanqie.createChapter(bookId, ch.volume_id || '', title, html, creds.cookie, creds.csrf);
      if (itemId) {
        Alert.alert('成功', `章节已上传`);
        setSelected(null);
        setContent('');
        loadChapters();
      }
    } catch (e) { Alert.alert('上传失败', e.message); }
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}><Text style={styles.back}>← 返回</Text></TouchableOpacity>
      <Text style={styles.title}>📖 {bookName}</Text>

      {selected ? (
        <ScrollView>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.back}>← 取消</Text></TouchableOpacity>
          <Text style={styles.sectionTitle}>上传章节: {selected.title}</Text>
          <TextInput style={[styles.input, { height: 300 }]} placeholder="输入章节内容（纯文本，自动转 HTML）"
            placeholderTextColor={C.muted} value={content} onChangeText={setContent} multiline />
          <TouchableOpacity style={styles.btn} onPress={() => handleUpload(selected)}>
            <Text style={styles.btnText}>⬆️ 上传</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => String(item.item_id || item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
              <Text style={styles.cardTitle}>第{item.index}章 {item.title}</Text>
              <Text style={styles.muted}>字数: {item.word_count || 0}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.muted}>暂无章节</Text>}
        />
      )}
    </View>
  );
}

// ── 主 App ──
export default function App() {
  const [screen, setScreen] = useState('login');
  const [accountName, setAccountName] = useState('');
  const [creds, setCreds] = useState({ cookie: '', csrf: '' });
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const handleLogin = (name, credentials, bookList) => {
    setAccountName(name);
    setCreds(credentials);
    setBooks(bookList);
    setScreen('books');
  };

  const handleRefreshBooks = (bookList) => setBooks(bookList);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setScreen('chapters');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'books' && (
        <BooksScreen books={books} creds={creds} accountName={accountName}
          onSelectBook={handleSelectBook} onRefresh={handleRefreshBooks} />
      )}
      {screen === 'chapters' && selectedBook && (
        <ChaptersScreen bookId={selectedBook.book_id || selectedBook.id}
          bookName={selectedBook.book_name || selectedBook.name}
          creds={creds} onBack={() => setScreen('books')} />
      )}
    </View>
  );
}

// ── 样式 ──
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: C.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.muted, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 },
  input: { backgroundColor: C.card, borderRadius: 10, padding: 12, fontSize: 14, color: C.text, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  btn: { backgroundColor: C.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  muted: { color: C.muted, fontSize: 13, marginBottom: 4 },
  back: { color: C.primary, fontSize: 16, marginBottom: 12 },
});
