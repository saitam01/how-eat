import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import i18n from '@/i18n/es.json';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={i18n.themeToggle}
      title={i18n.themeToggle}
      className="h-9 w-9 rounded-md border border-border hover:bg-muted"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
