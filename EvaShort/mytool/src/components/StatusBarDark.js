// ── Real status bar: light content on dark bg, dark content on light bg ──
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';

export default function StatusBarDark() {
  const { mode } = useTheme();
  // mode === 'dark' → flame-dark shell → light status text
  // mode === 'light' → white shell → dark status text
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent />;
}
