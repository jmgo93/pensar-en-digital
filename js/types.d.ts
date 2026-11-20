/** Tipos compartidos del proyecto (solo para comprobación con `npm run typecheck`). */

export type Lang = 'es' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type SchemeId = 'light' | 'dark' | 'light-hc' | 'dark-hc';

export interface Prefs {
  /** 1 = 100 %, 2 = 200 % */
  fontScale: number;
  theme: Theme;
  /** null = seguir prefers-contrast */
  highContrast: boolean | null;
  spacing: boolean;
  lang: Lang;
  tts: boolean;
  picto: boolean;
}

export interface PrefsApi {
  DEFAULTS: Prefs;
  get(): Prefs;
  /** Devuelve false si no se pudo guardar (se aplica igualmente). */
  set(patch: Partial<Prefs>): boolean;
  reset(): boolean;
  storageOk(): boolean;
  resolveScheme(prefs: Prefs): SchemeId;
}

export interface Route {
  id: string;
  /** Relativa a la raíz del sitio, con barra final ('' = inicio). */
  path: string;
  icon: string;
  bar: boolean;
  rail: boolean;
}

export interface Site {
  url: string;
  shortUrl: string;
  author: string;
  year: number;
  cepUrl: string;
  licenseContentUrl: string;
  licenseArasaacUrl: string;
  arasaacUrl: string;
  materialSymbolsUrl: string;
  /** URL /exec de la aplicación web de Apps Script (votaciones). Vacía = sin conectar. */
  votingEndpoint: string;
  languages: Lang[];
  defaultLanguage: Lang;
}

export interface Localized<T = string> {
  es: T;
  en: T;
}

export interface Vote {
  id: string;
  minute: string;
  block: Localized;
  context: Localized<string[]>;
  question: Localized;
  options: Localized[];
  /** URL corta del formulario (para el QR). */
  formUrl: string;
}

export type Strings = Record<string, string>;
export type UiStrings = Record<Lang, Strings>;

declare global {
  interface Window {
    pdPrefs: PrefsApi;
  }
}
