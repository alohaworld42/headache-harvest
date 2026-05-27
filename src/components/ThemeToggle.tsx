import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="h-4 w-4 text-headache" /> : <Moon className="h-4 w-4 text-headache" />}
    </Button>
  );
};

export default ThemeToggle;
