// ── Centered "coming soon" placeholder ──
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ComingSoon({
  title = 'Coming Soon',
  subtitle = 'More great content is coming soon. Stay tuned.',
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.root}>
      <Text style={[styles.icon, { color: colors.gold }]}>🚧</Text>
      <Text style={[styles.title, fonts.display, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  icon: { fontSize: 44, marginBottom: 16 },
  title: { fontSize: 22, textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
