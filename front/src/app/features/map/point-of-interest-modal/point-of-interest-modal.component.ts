import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { EditorModule } from 'primeng/editor';
import { SelectModule } from 'primeng/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  MapPointContent,
  MapPointImage,
  MapPointsService,
  MapPointTranslation,
} from '../map-points.service';
import { LoginService } from '../../login/login.service';
import { LanguagesService } from '../../language-modal/language.service';
import { Language } from '../../language-modal/models/languages';

@Component({
  selector: 'app-point-of-interest-modal',
  imports: [CommonModule, FormsModule, TranslateModule, EditorModule, SelectModule],
  templateUrl: './point-of-interest-modal.component.html',
  styleUrl: './point-of-interest-modal.component.scss',
})
export class PointOfInterestModalComponent implements OnInit {
  readonly config = inject(DynamicDialogConfig);
  private readonly mapPointsService = inject(MapPointsService);
  private readonly auth = inject(LoginService);
  private readonly languagesService = inject(LanguagesService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly point = this.config.data as {
    id: string | number;
    label: string;
    description: string;
    x: number;
    y: number;
  };

  protected loading = true;
  protected saving = false;
  protected uploading = false;
  protected editMode = false;
  protected content: MapPointContent | null = null;
  protected languages: Language[] = [];
  protected selectedLanguageCode = this.getCurrentLanguage();
  protected editTitle = '';
  protected editDescription = '';
  protected activeImageIndex = 0;
  protected lightboxImage: MapPointImage | null = null;
  protected textScale = 1;

  protected get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  protected get images(): MapPointImage[] {
    return this.content?.images ?? [];
  }

  protected get activeImage(): MapPointImage | null {
    return this.images[this.activeImageIndex] ?? null;
  }

  protected get descriptionFontSize(): string {
    return `${this.textScale}rem`;
  }

  protected get activeTranslation(): MapPointTranslation | null {
    return (
      this.content?.translations.find(
        (translation) => translation.languageCode === this.selectedLanguageCode
      ) ?? null
    );
  }

  protected get title(): string {
    return this.activeTranslation?.title || this.point.label;
  }

  protected get descriptionHtml(): string {
    return this.activeTranslation?.descriptionHtml || this.point.description || '';
  }

  async ngOnInit(): Promise<void> {
    await this.loadLanguages();
    await this.loadContent();
  }

  protected async onLanguageChange(languageCode: string): Promise<void> {
    this.selectedLanguageCode = languageCode;
    await this.loadContent();

    if (this.editMode) {
      this.setEditFieldsForSelectedLanguage();
    }
  }

  protected previousImage(): void {
    if (this.images.length < 2) {
      return;
    }

    this.activeImageIndex = (this.activeImageIndex - 1 + this.images.length) % this.images.length;
  }

  protected nextImage(): void {
    if (this.images.length < 2) {
      return;
    }

    this.activeImageIndex = (this.activeImageIndex + 1) % this.images.length;
  }

  protected openLightbox(image: MapPointImage | null): void {
    if (image) {
      this.lightboxImage = image;
    }
  }

  protected closeLightbox(): void {
    this.lightboxImage = null;
  }

  protected increaseText(): void {
    this.textScale = Math.min(1.6, Number((this.textScale + 0.1).toFixed(2)));
  }

  protected decreaseText(): void {
    this.textScale = Math.max(0.9, Number((this.textScale - 0.1).toFixed(2)));
  }

  protected resetText(): void {
    this.textScale = 1;
  }

  protected startEdit(): void {
    this.setEditFieldsForSelectedLanguage();
    this.editMode = true;
  }

  protected cancelEdit(): void {
    this.editMode = false;
  }

  protected async saveTranslation(): Promise<void> {
    if (!this.editTitle.trim()) {
      return;
    }

    this.saving = true;
    try {
      await firstValueFrom(
        this.mapPointsService.upsertTranslation(this.point.id, {
          languageCode: this.selectedLanguageCode,
          title: this.editTitle.trim(),
          descriptionHtml: this.editDescription,
        })
      );
      await this.loadContent();
      this.editMode = false;
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('MAP.POI_CONTENT_SAVED'),
        detail: this.translate.instant('MAP.POI_CONTENT_SAVED_DETAIL'),
      });
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('MAP.SAVE_ERROR'),
        detail: this.translate.instant('MAP.POI_CONTENT_SAVE_ERROR'),
      });
    } finally {
      this.saving = false;
    }
  }

  protected async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    this.uploading = true;
    try {
      await firstValueFrom(this.mapPointsService.uploadImage(this.point.id, file));
      await this.loadContent();
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('MAP.POI_IMAGE_UPLOAD_ERROR'),
        detail: this.translate.instant('MAP.POI_IMAGE_UPLOAD_ERROR_DETAIL'),
      });
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  protected async deleteImage(image: MapPointImage): Promise<void> {
    try {
      await firstValueFrom(this.mapPointsService.deleteImage(image.id));
      await this.loadContent();
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('MAP.POI_IMAGE_DELETE_ERROR'),
        detail: this.translate.instant('MAP.POI_IMAGE_DELETE_ERROR_DETAIL'),
      });
    }
  }

  private async loadContent(): Promise<void> {
    this.loading = true;
    try {
      this.content = await firstValueFrom(
        this.mapPointsService.getContent(this.point.id, this.selectedLanguageCode)
      );
      this.activeImageIndex = Math.min(this.activeImageIndex, Math.max(this.images.length - 1, 0));
      this.config.header = this.title;
    } catch (error) {
      console.error(error);
      this.content = null;
    } finally {
      this.loading = false;
    }
  }

  private async loadLanguages(): Promise<void> {
    try {
      this.languages = await firstValueFrom(this.languagesService.findAll());
      const defaultLanguage = this.languages.find((language) => language.isDefault);
      if (!this.languages.some((language) => language.code === this.selectedLanguageCode)) {
        this.selectedLanguageCode = defaultLanguage?.code ?? this.languages[0]?.code ?? 'es';
      }
    } catch (error) {
      console.error(error);
      this.languages = [];
    }
  }

  private getCurrentLanguage(): string {
    return localStorage.getItem('lang') || 'es';
  }

  private setEditFieldsForSelectedLanguage(): void {
    const translation = this.activeTranslation;
    this.editTitle = translation?.title || this.point.label;
    this.editDescription = translation?.descriptionHtml || this.point.description || '';
  }
}
