// ── Root navigation: tab bar + pushed screens ──
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { navTheme } from '../theme/ThemeContext';
import BottomTabBar from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DramaDetailScreen from '../screens/DramaDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';
import MoreListScreen from '../screens/MoreListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const navRef = React.useRef(null);

  // Web-only a11y fix. @react-navigation/elements marks every unfocused screen
  // container with `aria-hidden={!focused}`. When you tap a card, that button
  // keeps DOM focus, then its screen becomes unfocused and gets aria-hidden —
  // Chromium then logs "Blocked aria-hidden … descendant retained focus".
  // Blurring the focused element synchronously *before* React commits the new
  // tree (i.e. before the batched state update flushes) prevents the warning.
  // No-op on native, where `document` is undefined and iOS uses UIKit, not DOM.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const nav = navRef.current;
    if (!nav) return;
    const methods = ['navigate', 'push', 'replace', 'reset', 'goBack', 'pop', 'popToTop', 'dispatch'];
    methods.forEach((m) => {
      const orig = nav[m];
      if (typeof orig === 'function') {
        nav[m] = (...args) => {
          const el = document.activeElement;
          if (el && typeof el.blur === 'function') el.blur();
          return orig.call(nav, ...args);
        };
      }
    });
  }, []);

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="DramaDetail" component={DramaDetailScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="MoreList" component={MoreListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
