import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';

const COLORS = {
  bg: '#f5f0e8',
  card: '#ffffff',
  primary: '#8b5e3c',
  text: '#3a2f25',
  muted: '#8a7a68',
  border: '#e5dccb',
};

const BOOKS = [
  { id: '1', title: '平凡的世界', author: '路遥', desc: '黄土高原上的奋斗史诗' },
  { id: '2', title: '活着', author: '余华', desc: '讲述一个人一生的故事' },
  { id: '3', title: '百年孤独', author: '加西亚·马尔克斯', desc: '魔幻现实主义文学经典' },
  { id: '4', title: '红楼梦', author: '曹雪芹', desc: '中国古典四大名著之一' },
  { id: '5', title: '围城', author: '钱钟书', desc: '人生如围城，城外的人想进去' },
];

const SAMPLE_CONTENT = `第一章

那是在很久以前的一个黄昏，夕阳的余晖洒在窗前，整个世界仿佛都安静了下来。

她坐在窗边，翻着手中泛黄的书页，纸张发出的沙沙声像是时光在低语。窗外远处的炊烟缓缓升起，一切平常而温暖。

或许阅读的意义就在于此——在文字的世界里，我们可以抵达任何想去的地方，经历从未经历的人生。

每一本书都是一扇窗，推开它，便能看到不一样的世界。`;

function BookShelf({ onOpenBook }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>📚 书籍阅读</Text>
      <Text style={styles.subHeader}>阅读，让文化浸润生活</Text>
      <FlatList
        data={BOOKS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bookCard} onPress={() => onOpenBook(item)}>
            <View style={styles.bookCover}>
              <Text style={styles.bookCoverText}>📖</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
              <Text style={styles.bookDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Reader({ book, onBack }) {
  return (
    <View style={styles.container}>
      <SafeAreaView />
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← 返回书架</Text>
      </TouchableOpacity>
      <Text style={styles.readerTitle}>{book.title}</Text>
      <Text style={styles.readerAuthor}>{book.author}</Text>
      <Text style={styles.content}>{SAMPLE_CONTENT}</Text>
    </View>
  );
}

export default function App() {
  const [currentBook, setCurrentBook] = useState(null);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {currentBook ? (
        <Reader book={currentBook} onBack={() => setCurrentBook(null)} />
      ) : (
        <BookShelf onOpenBook={setCurrentBook} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subHeader: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  bookCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
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
  back: { fontSize: 16, color: COLORS.primary, marginBottom: 12 },
  readerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  readerAuthor: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  content: { fontSize: 16, lineHeight: 28, color: COLORS.text },
});
