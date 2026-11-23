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
  /** Etapa del perfil (content/perfiles.json) o null si no se ha elegido. */
  stage: string | null;
  specialty: string | null;
  /** Ya se mostró el selector de perfil del primer acceso. */
  profileAsked: boolean;
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
  /** Solo visible para el ponente (js/speaker.js). */
  speaker?: boolean;
}

export interface Site {
  url: string;
  shortUrl: string;
  author: string;
  /** Centro del autor (texto visible junto al nombre). */
  school: string;
  /** Logo del centro (ruta relativa a la raíz). */
  schoolLogo: string;
  year: number;
  cepUrl: string;
  licenseContentUrl: string;
  /** Nombre corto de la licencia del contenido y el código. */
  licenseShort: string;
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
  /** Índice de la opción buscada (votaciones de antes/después). */
  target?: number;
  /** Id de la votación emparejada (v0 ↔ v5). */
  pair?: string;
}

export type Strings = Record<string, string>;
export type UiStrings = Record<Lang, Strings>;

declare global {
  interface Window {
    pdPrefs: PrefsApi;
  }
}
