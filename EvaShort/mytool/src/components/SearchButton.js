// ── Search pill button: tap to open Discover (TikTok-style) ──
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function SearchButton({ onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.pill, { backgroundColor: colors.surface }]}>
      <Ionicons name="search" size={15} color={colors.textMuted} />
      <Text style={[styles.text, { color: colors.textMuted }]}>Search</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  text: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
