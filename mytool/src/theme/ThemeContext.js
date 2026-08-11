// ── Theme context: exposes design tokens to the whole tree ──
import { createContext, useContext } from 'react';
import { colors, spacing, radii, fonts, navTheme } from './tokens';

const ThemeContext = createContext({ colors, spacing, radii, fonts });

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ colors, spacing, radii, fonts }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { navTheme };
