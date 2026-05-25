import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  AppTranslationsService,
  PUBLIC_EDITABLE_PHRASES,
} from '../../app-translations/app-translations.service';
import { LanguagesService } from '../../language-modal/language.service';
import { Language } from '../../language-modal/models/languages';

@Component({
  selector: 'app-public-phrases-settings',
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TextareaModule, TranslatePipe],
  templateUrl: './public-phrases-settings.html',
  styleUrl: './public-phrases-settings.scss',
})
export class PublicPhrasesSettings implements OnInit {
  private readonly languagesService = inject(LanguagesService);
  private readonly appTranslations = inject(AppTranslationsService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  protected readonly phrases = PUBLIC_EDITABLE_PHRASES;
  protected languages: Language[] = [];
  protected selectedLanguageCode = '';
  protected values: Record<string, string> = {};
  protected loading = false;
  protected saving = false;

  async ngOnInit(): Promise<void> {
    this.languages = await firstValueFrom(this.languagesService.findAll());
    const defaultLanguage = this.languages.find((language) => language.isDefault);
    this.selectedLanguageCode = defaultLanguage?.code ?? this.languages[0]?.code ?? 'es';
    await this.loadPhrases();
  }

  protected async onLanguageChange(languageCode: string): Promise<void> {
    this.selectedLanguageCode = languageCode;
    await this.loadPhrases();
  }

  protected async save(): Promise<void> {
    this.saving = true;
    try {
      await firstValueFrom(
        this.appTranslations.saveLanguage(this.selectedLanguageCode, {
          phrases: this.phrases.map((phrase) => ({
            key: phrase.key,
            value: this.values[phrase.key] ?? '',
          })),
        })
      );

      await this.appTranslations.applyLanguage(this.selectedLanguageCode);

      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
        detail: this.translate.instant('SETTINGS.PUBLIC_PHRASES.SAVE_SUCCESS'),
      });
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON_LABELS.ERROR'),
        detail: this.translate.instant('SETTINGS.PUBLIC_PHRASES.SAVE_ERROR'),
      });
    } finally {
      this.saving = false;
    }
  }

  private async loadPhrases(): Promise<void> {
    this.loading = true;
    try {
      const stored = await firstValueFrom(
        this.appTranslations.findByLanguage(this.selectedLanguageCode)
      );

      this.values = this.phrases.reduce<Record<string, string>>((acc, phrase) => {
        acc[phrase.key] = stored[phrase.key] ?? this.translate.instant(phrase.key);
        if (acc[phrase.key] === phrase.key) {
          acc[phrase.key] = phrase.fallback;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error(error);
      this.values = this.phrases.reduce<Record<string, string>>((acc, phrase) => {
        acc[phrase.key] = phrase.fallback;
        return acc;
      }, {});
    } finally {
      this.loading = false;
    }
  }
}
