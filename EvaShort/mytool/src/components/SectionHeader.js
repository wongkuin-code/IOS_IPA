// ── Section header: flame + title + "More >" ──
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SectionHeader({ title, onMore }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {onMore ? (
        <TouchableOpacity onPress={onMore} hitSlop={8}>
          <Text style={[styles.more, { color: colors.textMuted }]}>More &gt;</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 14,
    paddingHorizontal: 18,
  },
  title: { fontSize: 19, fontWeight: '700' },
  more: { fontSize: 13, fontWeight: '600' },
});
