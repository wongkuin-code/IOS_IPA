// ── Design tokens: flame accent on deep charcoal (DramaBox-style) ──
import { DarkTheme } from '@react-navigation/native';

export const colors = {
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
  danger: '#C0392B',
  rating: ['#FF9A3C', '#FF4D2E', '#E62E5C'], // flame gradient stops
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
    border: '#1A1A23',
    notification: colors.gold,
  },
};
