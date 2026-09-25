export type AppTheme = 'dark' | 'forest' | 'black' | 'light';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Nocturn Cormoran',
    description: 'Tema standard întunecată cu accente de smarald și albastru nocturn',
    previewBg: '#07090d',
    previewCard: '#0c1017',
    previewAccent: '#10b981',
    isDark: true,
  },
  {
    id: 'forest',
    name: 'Verde Pădure',
    description: 'Inspirație din taberele montane și codrii cercetășești',
    previewBg: '#06130b',
    previewCard: '#0b1f13',
    previewAccent: '#22c55e',
    isDark: true,
  },
  {
    id: 'black',
    name: 'Negru OLED',
    description: 'Contrast maxim negru pur, ideal pentru expediții de noapte',
    previewBg: '#000000',
    previewCard: '#0d0d0d',
    previewAccent: '#34d399',
    isDark: true,
  },
  {
    id: 'light',
    name: 'Luminos (Hârtie de Hartă)',
    description: 'Fundal deschis confortabil pentru citit la lumina zilei',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewAccent: '#059669',
    isDark: false,
  },
];

const THEME_STORAGE_KEY = 'cormo_app_theme';

type ThemeChangeListener = (theme: AppTheme) => void;
const listeners: Set<ThemeChangeListener> = new Set();

export function getAppTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'forest' || saved === 'black' || saved === 'light') {
    return saved;
  }
  return 'dark';
}

export function setAppTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeToDOM(theme);
  listeners.forEach((fn) => fn(theme));
}

export function subscribeToTheme(listener: ThemeChangeListener): () => void {
  listeners.add(listener);
  listener(getAppTheme());
  return () => {
    listeners.delete(listener);
  };
}

export function applyThemeToDOM(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  root.classList.remove('theme-dark', 'theme-forest', 'theme-black', 'theme-light');
  root.classList.add(`theme-${theme}`);
  
  if (theme === 'light') {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  } else {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  }
}
