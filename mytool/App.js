// ── Root: font loading + providers + navigator + global paywall ──
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlayfairDisplay_700Bold_Italic,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import { ThemeProvider } from './src/theme/ThemeContext';
import { UnlockProvider } from './src/iap/UnlockContext';
import AppNavigator from './src/navigation/AppNavigator';
import PaywallModal from './src/components/PaywallModal';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold_Italic,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1410', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UnlockProvider>
          <AppNavigator />
          <PaywallModal />
        </UnlockProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
