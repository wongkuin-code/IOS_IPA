// ── Horizontal poster strip (continue watching / daily picks / similar) ──
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import PosterCard from './PosterCard';

export default function PosterStrip({ data, lockedIds, onPressItem, width = 118 }) {
  const { spacing } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {data.map((drama) => (
        <PosterCard
          key={String(drama.id)}
          drama={drama}
          width={width}
          locked={lockedIds && lockedIds.has(drama.id)}
          onPress={() => onPressItem(drama)}
          style={{ marginRight: 12, marginLeft: spacing.md }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingRight: 16 },
});
