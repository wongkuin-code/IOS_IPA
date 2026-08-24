import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

// Web 上 react-native-screens 的 display:none 屏隐藏机制会失效，导致切换页面时旧屏残留（ghost screen）。
// 关闭它，让 React Navigation 退回到普通 View 的挂载/卸载语义，Web 端切页不再残留。
if (Platform.OS === 'web') {
  enableScreens(false);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
