import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { GeneralSettingsService } from './general-settings.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { noImageDataUri } from '../../../../assets/empty-image';
import { CompanySettings } from './models/company-settings';

@Component({
  selector: 'app-general-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    TranslatePipe,
  ],
  templateUrl: './general-settings.html',
  styleUrl: './general-settings.scss'
})
export class GeneralSettings implements OnInit {
  private translate = inject(TranslateService);

  form!: FormGroup;
  logoPreview: string | null = null;
  infoMarkerIconPreview: string | null = null;
  touristMarkerIconPreview: string | null = null;

  logoChanged = false;
  infoMarkerChanged = false;
  touristMarkerChanged = false;

  logoFileBlob: Blob | null = null;
  infoMarkerFileBlob: Blob | null = null;
  touristMarkerFileBlob: Blob | null = null;

  noImageUri = noImageDataUri;

  constructor(
    private fb: FormBuilder,
    private settingsService: GeneralSettingsService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      logoBase64: [null],
      phone: [''],
      phoneIsWhatsApp: [false],
      email: ['', [Validators.email]],
      backgroundColor: ['#ffffff', Validators.required],
      headerColor: ['#ffffff', Validators.required],
      buttonColor: ['#000000', Validators.required],
      infoMarkerIconBase64: [null],
      touristMarkerIconBase64: [null],
    });

    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        if (!settings) {
          return;
        }

        this.form.patchValue({
          logoBase64: settings.logoBase64 ? settings.logoBase64 : null,
          phone: settings.phone ?? '',
          phoneIsWhatsApp: settings.phoneIsWhatsApp ?? false,
          email: settings.email ?? '',
          backgroundColor: settings.backgroundColor ?? '#ffffff',
          headerColor: settings.headerColor ?? '#ffffff',
          buttonColor: settings.buttonColor ?? '#000000',
          infoMarkerIconBase64: settings.infoMarkerIconBase64 ?? null,
          touristMarkerIconBase64: settings.touristMarkerIconBase64 ?? null,
        });

        this.logoPreview = settings.logoUrl || settings.logoBase64 || null;
        this.infoMarkerIconPreview = settings.infoMarkerIconUrl || settings.infoMarkerIconBase64 || null;
        this.touristMarkerIconPreview = settings.touristMarkerIconUrl || settings.touristMarkerIconBase64 || null;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('COMMON_LABELS.UNKNOWN_ERROR')
        });
      }
    });
  }

  private readonly MAX_IMAGE_SIZE_BYTES = 120 * 1024; // 120 KB por imagen (limite estricto)
  private readonly MAX_TOTAL_IMAGES_SIZE_BYTES = 320 * 1024; // 320 KB total de las 3 imágenes
  private readonly MAX_IMAGE_DIMENSION = 640; // anchos / altos máximos
  private readonly MIN_IMAGE_DIMENSION = 64;

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private getBase64SizeBytes(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    return Math.round((base64.length * 3) / 4) - padding;
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private dataURLtoBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  private async compressImageFile(file: File): Promise<string> {
    const originalDataUrl = await this.readFileAsDataUrl(file);
    if (this.getBase64SizeBytes(originalDataUrl) <= this.MAX_IMAGE_SIZE_BYTES) {
      return originalDataUrl;
    }

    const img = await this.loadImage(originalDataUrl);
    let width = img.width;
    let height = img.height;

    if (width > height && width > this.MAX_IMAGE_DIMENSION) {
      height = Math.round((height * this.MAX_IMAGE_DIMENSION) / width);
      width = this.MAX_IMAGE_DIMENSION;
    } else if (height > width && height > this.MAX_IMAGE_DIMENSION) {
      width = Math.round((width * this.MAX_IMAGE_DIMENSION) / height);
      height = this.MAX_IMAGE_DIMENSION;
    } else if (width > this.MAX_IMAGE_DIMENSION || height > this.MAX_IMAGE_DIMENSION) {
      width = Math.min(width, this.MAX_IMAGE_DIMENSION);
      height = Math.min(height, this.MAX_IMAGE_DIMENSION);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return originalDataUrl;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.9;
    let mimeType = 'image/webp';
    let compressedDataUrl = canvas.toDataURL(mimeType, quality);

    // Fallback a JPEG cuando no soporte o si no baja el tamaño suficiente
    if (!compressedDataUrl.startsWith('data:image/webp')) {
      mimeType = 'image/jpeg';
      compressedDataUrl = canvas.toDataURL(mimeType, quality);
    }

    while (this.getBase64SizeBytes(compressedDataUrl) > this.MAX_IMAGE_SIZE_BYTES && quality > 0.2) {
      quality -= 0.1;
      compressedDataUrl = canvas.toDataURL(mimeType, quality);
    }

    while (this.getBase64SizeBytes(compressedDataUrl) > this.MAX_IMAGE_SIZE_BYTES && (width > this.MIN_IMAGE_DIMENSION || height > this.MIN_IMAGE_DIMENSION)) {
      width = Math.max(this.MIN_IMAGE_DIMENSION, Math.round(width * 0.8));
      height = Math.max(this.MIN_IMAGE_DIMENSION, Math.round(height * 0.8));
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      quality = Math.max(0.2, quality - 0.1);
      compressedDataUrl = canvas.toDataURL(mimeType, quality);
    }

    return compressedDataUrl;
  }

  clearImage(controlName: 'logoBase64' | 'infoMarkerIconBase64' | 'touristMarkerIconBase64'): void {
    const control = this.form.get(controlName);
    if (!control) {
      return;
    }

    control.setValue(null);

    if (controlName === 'logoBase64') {
      this.logoPreview = null;
      this.logoChanged = true;
      this.logoFileBlob = null;
    } else if (controlName === 'infoMarkerIconBase64') {
      this.infoMarkerIconPreview = null;
      this.infoMarkerChanged = true;
      this.infoMarkerFileBlob = null;
    } else if (controlName === 'touristMarkerIconBase64') {
      this.touristMarkerIconPreview = null;
      this.touristMarkerChanged = true;
      this.touristMarkerFileBlob = null;
    }
  }

  async onImageChange(event: Event, controlName: 'logoBase64' | 'infoMarkerIconBase64' | 'touristMarkerIconBase64'): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('COMMON_LABELS.ERROR'),
        detail: this.translate.instant('SETTINGS.GENERAL.FILE_MUST_BE_IMAGE') || 'El archivo debe ser una imagen.'
      });
      return;
    }

    try {
      const compressedDataUrl = await this.compressImageFile(file);
      const compressedSizeKB = (this.getBase64SizeBytes(compressedDataUrl) / 1024).toFixed(1);
      const originalDataUrl = await this.readFileAsDataUrl(file);
      const originalSizeKB = (this.getBase64SizeBytes(originalDataUrl) / 1024).toFixed(1);

      if (this.getBase64SizeBytes(compressedDataUrl) > this.MAX_IMAGE_SIZE_BYTES) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translate.instant('COMMON_LABELS.WARNING'),
          detail: this.translate.instant('SETTINGS.GENERAL.IMAGE_SIZE_TOO_LARGE') ||
            `La imagen sigue siendo mayor de ${this.MAX_IMAGE_SIZE_BYTES / 1024} KB tras compresión (${compressedSizeKB} KB). Elige una imagen más pequeña o menos detalle.`,
        });
        this.form.get(controlName)?.setValue(null);
        return;
      } else {
        this.messageService.add({
          severity: 'info',
          summary: this.translate.instant('COMMON_LABELS.INFO'),
          detail: this.translate.instant('SETTINGS.GENERAL.IMAGE_COMPRESSED_SUCCESS') ||
            `Imagen comprimida: ${originalSizeKB} KB → ${compressedSizeKB} KB`,
        });
      }

      this.form.get(controlName)?.setValue(compressedDataUrl);
      const compressedBlob = this.dataURLtoBlob(compressedDataUrl);

      if (controlName === 'logoBase64') {
        this.logoPreview = compressedDataUrl;
        this.logoChanged = true;
        this.logoFileBlob = compressedBlob;
      }
      if (controlName === 'infoMarkerIconBase64') {
        this.infoMarkerIconPreview = compressedDataUrl;
        this.infoMarkerChanged = true;
        this.infoMarkerFileBlob = compressedBlob;
      }
      if (controlName === 'touristMarkerIconBase64') {
        this.touristMarkerIconPreview = compressedDataUrl;
        this.touristMarkerChanged = true;
        this.touristMarkerFileBlob = compressedBlob;
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON_LABELS.ERROR'),
        detail: this.translate.instant('COMMON_LABELS.UNKNOWN_ERROR')
      });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.value;
    const basicPayload: Partial<CompanySettings> = {
      phone: values.phone,
      phoneIsWhatsApp: values.phoneIsWhatsApp,
      email: values.email,
      backgroundColor: values.backgroundColor,
      headerColor: values.headerColor,
      buttonColor: values.buttonColor,
    };

    const logoBytes = values.logoBase64 ? this.getBase64SizeBytes(values.logoBase64) : 0;
    const infoBytes = values.infoMarkerIconBase64 ? this.getBase64SizeBytes(values.infoMarkerIconBase64) : 0;
    const touristBytes = values.touristMarkerIconBase64 ? this.getBase64SizeBytes(values.touristMarkerIconBase64) : 0;
    const totalBytes = logoBytes + infoBytes + touristBytes;

    if (totalBytes > this.MAX_TOTAL_IMAGES_SIZE_BYTES) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('COMMON_LABELS.WARNING'),
        detail: this.translate.instant('SETTINGS.GENERAL.IMAGE_TOTAL_TOO_LARGE') ||
          `El tamaño total de imágenes es demasiado grande (${(totalBytes / 1024).toFixed(1)} KB). Reduce o borra alguna imagen antes de guardar.`,
      });
      return;
    }

    try {
      await firstValueFrom(this.settingsService.saveSettings(basicPayload));

      if (this.logoChanged && this.logoFileBlob) {
        await firstValueFrom(this.settingsService.uploadLogo(this.logoFileBlob));
      }
      if (this.infoMarkerChanged && this.infoMarkerFileBlob) {
        await firstValueFrom(this.settingsService.uploadInfoMarkerIcon(this.infoMarkerFileBlob));
      }
      if (this.touristMarkerChanged && this.touristMarkerFileBlob) {
        await firstValueFrom(this.settingsService.uploadTouristMarkerIcon(this.touristMarkerFileBlob));
      }

      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
        detail: this.translate.instant('SETTINGS.GENERAL.SAVE_SUCCESS')
      });

      this.logoChanged = false;
      this.infoMarkerChanged = false;
      this.touristMarkerChanged = false;
      this.logoFileBlob = null;
      this.infoMarkerFileBlob = null;
      this.touristMarkerFileBlob = null;
    } catch (err) {
      const errorMessage = (err as any)?.error?.message || this.translate.instant('SETTINGS.GENERAL.SAVE_ERROR');
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON_LABELS.ERROR'),
        detail: errorMessage,
      });
    }
  }
}


