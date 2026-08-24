// ── Horizontal scrollable category pill chips, accent fill on active ──
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            {isActive ? (
              <LinearGradient
                colors={[colors.goldLight, colors.goldDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill}
              >
                <Text style={[styles.label, styles.activeLabel]}>{tab}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.pill, styles.pillInactive, { borderColor: colors.borderGold }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{tab}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, flexShrink: 1 },
  content: { paddingRight: 16, paddingVertical: 2 },
  tab: { marginRight: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  pillInactive: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  label: { fontSize: 14, fontWeight: '700' },
  activeLabel: { color: '#200B06' },
});
