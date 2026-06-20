// Available palettes (curated to the ones worth living with).
// `swatch` colors are only used for the Settings previews.
export type ThemeId =
'chalkboard' |
'ink' |
'inknoir' |
'silks' |
'parlor' |
'speakeasy';
export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  dark?: boolean;
  swatch: {
    bg: string;
    primary: string;
    accent: string;
  };
}
export const THEMES: ThemeOption[] = [
{
  id: 'chalkboard',
  name: 'Chalkboard',
  description: 'Slate brand & chalk cyan — green reserved for wins.',
  swatch: { bg: '#F8FAFC', primary: '#334155', accent: '#06B6D4' }
},
{
  id: 'ink',
  name: 'Ink',
  description: 'Newsprint black & white with cash-green money.',
  swatch: { bg: '#FAF9F6', primary: '#111827', accent: '#16A34A' }
},
{
  id: 'inknoir',
  name: 'Ink Noir',
  description: 'Dark newsprint with neon cash-green money.',
  dark: true,
  swatch: { bg: '#0C0C0E', primary: '#E5E7EB', accent: '#22C55E' }
},
{
  id: 'silks',
  name: 'Silks',
  description: 'Oxblood & teal on warm cream paper.',
  swatch: { bg: '#FBF7EF', primary: '#8B1E3F', accent: '#0D9488' }
},
{
  id: 'parlor',
  name: 'Parlor',
  description: 'Maroon & antique gold on parchment.',
  swatch: { bg: '#F7F1E6', primary: '#7A1626', accent: '#C8A24B' }
},
{
  id: 'speakeasy',
  name: 'Speakeasy',
  description: 'Dark mode — smoky maroon & gold.',
  dark: true,
  swatch: { bg: '#14100E', primary: '#B0344C', accent: '#E3BD5B' }
}];

export const DEFAULT_THEME: ThemeId = 'chalkboard';
// Bumped so any previously-saved palette resets to the current default.
const STORAGE_KEY = 'ftc-theme-v4';
export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  return stored && THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
}
export function applyTheme(id: ThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', id);
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, id);
  }
}