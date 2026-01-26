import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * ThemeProvider - Initializes theme on app load
 * This ensures theme is applied immediately when the app starts
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  // Theme is already initialized by useTheme hook
  // This component just ensures the hook is called at the app level
  useEffect(() => {
    // Ensure theme class is applied to document root
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

