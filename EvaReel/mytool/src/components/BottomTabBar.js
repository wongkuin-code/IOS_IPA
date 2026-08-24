// ── Custom bottom tab bar: black bar, gold hairline seam, gold active tint ──
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const ITEMS = [
  { key: 'Home', label: 'Home', icon: '🏠' },
  { key: 'Discover', label: 'Discover', icon: '🧭' },
  { key: 'Library', label: 'Library', icon: '🔖' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

export default function BottomTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { backgroundColor: colors.tabBarBg, paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route, index) => {
        const item = ITEMS.find((i) => i.key === route.name) || ITEMS[index];
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.item}>
            <Text style={[styles.icon, focused && { transform: [{ scale: 1.08 }] }]}>{item.icon}</Text>
            <Text style={[styles.label, { color: focused ? colors.gold : colors.tabBarLabel }]}>
              {item.label}
            </Text>
            {focused ? <View style={[styles.dot, { backgroundColor: colors.gold }]} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.22)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 11, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
});
