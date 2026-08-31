// ── 2-column poster grid (FlatList, supports onEndReached pagination) ──
import { FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import PosterCard from './PosterCard';

export default function DramaGrid({ data, lockedIds, onPressItem, onEndReached, style }) {
  const { colors, spacing } = useTheme();
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      renderItem={({ item }) => (
        <PosterCard
          drama={item}
          locked={lockedIds && lockedIds.has(item.id)}
          onPress={() => onPressItem(item)}
        />
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }, style]}
      columnWrapperStyle={styles.row}
      style={styles.list}
      initialNumToRender={12}
      ListEmptyComponent={null}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 24 },
});
