// ── Real status bar (light content on dark background), no fake bar ──
import { StatusBar } from 'expo-status-bar';

export default function StatusBarDark() {
  return <StatusBar style="light" backgroundColor="transparent" translucent />;
}
