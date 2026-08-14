// ── Custom bottom tab bar: Ionicons, accent active, dark bar ──
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const ITEMS = [
  { key: 'Home', label: 'For You', icon: 'home', iconActive: 'home' },
  { key: 'Discover', label: 'Search', icon: 'search', iconActive: 'search' },
  { key: 'Library', label: 'My List', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { key: 'Profile', label: 'Me', icon: 'person-outline', iconActive: 'person' },
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
            <View style={[styles.iconWrap, focused && { backgroundColor: 'rgba(255,77,46,0.14)' }]}>
              <Ionicons
                name={focused ? item.iconActive : item.icon}
                size={22}
                color={focused ? colors.gold : colors.tabBarLabel}
              />
            </View>
            <Text style={[styles.label, { color: focused ? colors.gold : colors.tabBarLabel }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 34, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
