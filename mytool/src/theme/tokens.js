// ── Design tokens: exact hex values per spec ──
import { DarkTheme } from '@react-navigation/native';

export const colors = {
  background: '#0D0B09',   // near-black warm brown (black shell)
  surface: '#2A211A',      // warm dark-coffee card (ref #2D2822-#3A3028)
  surfaceLight: '#3A2E24', // elevated surface (ref #3C3026-#4E3E32)
  gold: '#D4AF37',         // champagne gold accent
  goldLight: '#F5D98B',    // gradient top
  goldDeep: '#9C7A1E',     // gradient bottom (deeper for dark bg)
  text: '#F5F1EA',         // soft white
  textMuted: '#A8987C',    // muted gold-beige
  tabBarBg: '#171717',     // neutral black-gray bar (ref #1A1A1A)
  tabBarLabel: '#7A6A4E',  // inactive gold-brown
  borderGold: 'rgba(212,175,55,0.2)', // black-gold hairline seams
  danger: '#C0392B',
  rating: ['#F5D98B', '#D4AF37', '#9C7A1E'], // gold gradient stops
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

// Playfair Display loaded via @expo-google-fonts/playfair-display
export const fonts = {
  display: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontStyle: 'italic',
  },
  displayMedium: {
    fontFamily: 'PlayfairDisplay_600SemiBold_Italic',
    fontStyle: 'italic',
  },
  displayRegular: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontStyle: 'italic',
  },
  ui: {}, // system sans (default RN font)
  uiBold: { fontWeight: '700' },
};

// 继承 DarkTheme 的 fonts(regular/medium/bold/heavy),否则 native-stack 读取
// theme.fonts.regular 时因 fonts 为 undefined 崩溃
export const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: '#2A211A',
    notification: colors.gold,
  },
};
