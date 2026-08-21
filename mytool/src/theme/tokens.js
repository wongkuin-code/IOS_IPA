// ── Design tokens: flame accent on dual light/dark palettes (DramaBox-style) ──
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

// Keep flame accent identical across themes; only surfaces/text flip.
export const darkColors = {
  background: '#0D0D12',   // near-black blue-charcoal shell
  surface: '#1A1A23',      // dark card
  surfaceLight: '#26262F', // elevated surface
  gold: '#FF4D2E',         // flame accent (primary)
  goldLight: '#FF9A3C',    // gradient top (orange)
  goldDeep: '#E62E5C',     // gradient bottom (pink-red)
  text: '#FFFFFF',         // pure white
  textMuted: '#8E8E99',    // muted gray
  tabBarBg: '#131318',     // tab bar background
  tabBarLabel: '#5E5E6B',  // inactive tab label
  borderGold: 'rgba(255,77,46,0.22)', // accent hairline seams
  border: 'rgba(255,255,255,0.08)',   // neutral divider on dark
  danger: '#C0392B',
  rating: ['#FF9A3C', '#FF4D2E', '#E62E5C'], // flame gradient stops
};

export const lightColors = {
  background: '#F4F4F6',   // soft off-white shell
  surface: '#FFFFFF',      // white card
  surfaceLight: '#FFFFFF', // elevated surface
  gold: '#FF4D2E',         // flame accent (primary) — same brand
  goldLight: '#FF9A3C',
  goldDeep: '#E62E5C',
  text: '#1A1A23',         // near-black ink
  textMuted: '#8A8A94',    // muted gray
  tabBarBg: '#FFFFFF',     // white tab bar
  tabBarLabel: '#9A9AA4',  // inactive tab label
  borderGold: 'rgba(255,77,46,0.20)', // accent hairline seams
  border: 'rgba(0,0,0,0.08)',         // neutral divider on light
  danger: '#C0392B',
  rating: ['#FF9A3C', '#FF4D2E', '#E62E5C'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  card: 14,
  pill: 999,
};

// Poppins loaded via @expo-google-fonts/poppins
export const fonts = {
  display: {
    fontFamily: 'Poppins_800ExtraBold',
  },
  displayMedium: {
    fontFamily: 'Poppins_700Bold',
  },
  displayRegular: {
    fontFamily: 'Poppins_600SemiBold',
  },
  ui: {}, // system sans (default RN font)
  uiBold: { fontWeight: '700' },
};

// Build a react-navigation theme for the given mode.
export function buildNavTheme(mode) {
  const c = mode === 'light' ? lightColors : darkColors;
  const base = mode === 'light' ? DefaultTheme : DarkTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.gold,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      notification: c.gold,
    },
  };
}
