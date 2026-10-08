'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a static placeholder with the same dimensions
    return (
      <div
        className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 h-8 w-[92px] ${className}`}
        aria-hidden="true"
      />
    );
  }

  const options = [
    { value: 'light' as const, label: 'Modo Claro', icon: Sun },
    { value: 'system' as const, label: 'Sistema', icon: Laptop },
    { value: 'dark' as const, label: 'Modo Oscuro', icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Seleccionar tema"
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-colors ${className}`}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            className={`p-1.5 rounded-md transition-all duration-150 flex items-center justify-center ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        );
      })}
    </div>
  );
}
