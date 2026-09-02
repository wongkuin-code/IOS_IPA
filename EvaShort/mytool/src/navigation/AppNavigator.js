// ── Root navigation: auth gate + tab bar + pushed screens ──
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import BottomTabBar from '../components/BottomTabBar';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DramaDetailScreen from '../screens/DramaDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';
import MoreListScreen from '../screens/MoreListScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Web 上 native-stack 的转场依赖原生驱动，在浏览器里无原生动画，旧屏靠 transform 隐藏会失效 → 切页残留 item。
// 故 Web 改用 @react-navigation/stack 的 JS 栈（标准 Animated，正确挂载/卸载/隐藏），原生端仍用 native-stack 保留原生转场。
const NativeStack = createNativeStackNavigator();
const JsStack = createStackNavigator();
const Stack = Platform.OS === 'web' ? JsStack : NativeStack;
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, navTheme } = useTheme();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Web 端 JS 栈关闭转场动画，避免 Animated 转场在浏览器里产生残留/闪烁
          ...(Platform.OS === 'web' ? { animationEnabled: false } : {}),
        }}
      >
        {status === 'signedOut' ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="DramaDetail" component={DramaDetailScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} />
            <Stack.Screen name="MoreList" component={MoreListScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
