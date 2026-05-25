import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom } from 'rxjs';

export interface EditablePhrase {
  key: string;
  labelKey: string;
  fallback: string;
}

export interface AppTranslationPayload {
  phrases: Array<{ key: string; value: string }>;
}

export const PUBLIC_EDITABLE_PHRASES: EditablePhrase[] = [
  { key: 'HEADER.LANGUAGE_LABEL', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_LANGUAGE_SELECTOR', fallback: 'Idioma' },
  { key: 'MAP.POINT_OF_INTEREST', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_POINT_OF_INTEREST', fallback: 'Punto de interés' },
  { key: 'MAP.INFO_SCREEN', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_INFO_SCREEN', fallback: 'Pantalla de información' },
  { key: 'MAP.YOU_ARE_HERE', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_YOU_ARE_HERE', fallback: 'Usted está aquí' },
  { key: 'MAP.LEGEND_INTEREST_POINT', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_LEGEND_INTEREST', fallback: 'Punto de interés' },
  { key: 'MAP.LEGEND_INFO_POINT', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_LEGEND_INFO', fallback: 'Punto de información' },
  { key: 'MAP.LEGEND_YOU_ARE_HERE', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_LEGEND_HERE', fallback: 'Usted está aquí' },
  { key: 'MAP.POI_TEXT_DECREASE', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_TEXT_DECREASE', fallback: 'Reducir texto' },
  { key: 'MAP.POI_TEXT_INCREASE', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_TEXT_INCREASE', fallback: 'Aumentar texto' },
  { key: 'MAP.POI_TEXT_RESET', labelKey: 'SETTINGS.PUBLIC_PHRASES.LABEL_TEXT_RESET', fallback: 'Restablecer texto' },
];

@Injectable({ providedIn: 'root' })
export class AppTranslationsService {
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly api = 'http://localhost:3000/app-translations';

  findByLanguage(languageCode: string): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.api}/${languageCode}`);
  }

  saveLanguage(languageCode: string, payload: AppTranslationPayload) {
    return this.http.put(`${this.api}/${languageCode}`, payload);
  }

  async applyLanguage(languageCode: string): Promise<void> {
    const phrases = await firstValueFrom(this.findByLanguage(languageCode));
    this.translate.setTranslation(languageCode, this.expandFlatTranslations(phrases) as any, true);
  }

  private expandFlatTranslations(phrases: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    Object.entries(phrases).forEach(([key, value]) => {
      const parts = key.split('.');
      let cursor = result;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          cursor[part] = value;
          return;
        }

        cursor[part] = (cursor[part] as Record<string, unknown>) ?? {};
        cursor = cursor[part] as Record<string, unknown>;
      });
    });

    return result;
  }
}
