// ── Theme context: exposes design tokens + light/dark mode to the whole tree ──
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { lightColors, darkColors, spacing, radii, fonts, buildNavTheme } from './tokens';

const STORAGE_KEY = 'evashort_theme_mode';

const ThemeContext = createContext({
  colors: lightColors,
  mode: 'light',
  setMode: () => {},
  toggleTheme: () => {},
  spacing,
  radii,
  fonts,
  navTheme: buildNavTheme('light'),
});

export function ThemeProvider({ children }) {
  // Default theme is LIGHT per product spec.
  const [mode, setModeState] = useState('light');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (active && (v === 'light' || v === 'dark')) setModeState(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const colors = mode === 'light' ? lightColors : darkColors;
  const navTheme = buildNavTheme(mode);

  const setMode = (next) => {
    if (next !== 'light' && next !== 'dark') return;
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = () => setMode(mode === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, toggleTheme, spacing, radii, fonts, navTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
