// ── Horizontal scrollable category tabs with gold underline on active ──
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function CategoryTabs({ tabs, active, onChange }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity key={tab} onPress={() => onChange(tab)} style={styles.tab}>
            <Text style={[styles.label, { color: isActive ? colors.gold : colors.textMuted }]}>
              {tab}
            </Text>
            {isActive ? <View style={[styles.underline, { backgroundColor: colors.gold }]} /> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, flexShrink: 1 },
  content: { paddingRight: 16, alignItems: 'flex-end' },
  tab: { marginRight: 26, paddingBottom: 4, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
  underline: { height: 2, width: 22, marginTop: 4, borderRadius: 1 },
});
