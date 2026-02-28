import type { TranslationMap } from './types';
import { HttpClient } from './http';

export class LocalizationModule {
  private cache = new Map<string, TranslationMap>();

  constructor(private http: HttpClient) {}

  /** Get translations for a specific locale */
  async getTranslations(locale: string): Promise<TranslationMap> {
    const cached = this.cache.get(locale);
    if (cached) return cached;

    const result = await this.http.get<{ translations: TranslationMap }>(
      `/api/v1/localization/${locale}`,
    );
    const translations = result.translations || {};
    this.cache.set(locale, translations);
    return translations;
  }

  /** Get a list of available locales */
  async getLocales(): Promise<{ code: string; name: string; isDefault: boolean }[]> {
    const result = await this.http.get<{ locales: { code: string; name: string; isDefault: boolean }[] }>(
      '/api/v1/localization/locales',
    );
    return result.locales || [];
  }

  /** Get a single translation key with fallback */
  async translate(locale: string, key: string, fallback?: string): Promise<string> {
    const translations = await this.getTranslations(locale);
    return translations[key] ?? fallback ?? key;
  }

  /** Clear the translation cache */
  clearCache(): void {
    this.cache.clear();
  }
}
