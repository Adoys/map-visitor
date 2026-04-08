import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { CompanySettings } from './models/company-settings';
import { SocketService } from '../../../core/services/socket.service';


@Injectable({ providedIn: 'root' })
export class GeneralSettingsService {
  private api = 'http://localhost:3000/company-settings';
  private document = inject(DOCUMENT);

  settings = signal<CompanySettings | null>(null);

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.subscribeToSocketUpdates();
    effect(() => {
      this.applyTheme(this.settings());
    });
  }

  private subscribeToSocketUpdates() {
    this.socketService.settingsUpdated$.subscribe((updatedSettings: CompanySettings) => {
      this.mergeSettings(updatedSettings);
    });
  }

  loadSettings() {
    return this.http.get<CompanySettings>(this.api).pipe(
      tap((res) => this.settings.set(res))
    );
  }

  saveSettings(settings: Partial<CompanySettings>) {
    return this.http.patch<CompanySettings>(this.api, settings).pipe(
      tap((res) => this.mergeSettings(res))
    );
  }

  uploadLogo(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('logo', imageBlob, 'logo.png');

    return this.http.patch<CompanySettings>(`${this.api}/logo`, formData).pipe(
      tap((res) => this.mergeSettings(res))
    );
  }

  uploadInfoMarkerIcon(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('infoMarkerIcon', imageBlob, 'info-marker-icon.png');

    return this.http.patch<CompanySettings>(`${this.api}/info-marker-icon`, formData).pipe(
      tap((res) => this.mergeSettings(res))
    );
  }

  uploadTouristMarkerIcon(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('touristMarkerIcon', imageBlob, 'tourist-marker-icon.png');

    return this.http.patch<CompanySettings>(`${this.api}/tourist-marker-icon`, formData).pipe(
      tap((res) => this.mergeSettings(res))
    );
  }

  getLogo(): string | null {
    const s = this.settings();
    if (!s) return null;

    if (s.logoUrl) return s.logoUrl;
    if (s.logoBase64) return s.logoBase64.startsWith('data:') ? s.logoBase64 : `data:image/png;base64,${s.logoBase64}`;

    return null;
  }

  getPhone(): string | null {
    return this.settings()?.phone ?? null;
  }

  isPhoneWhatsApp(): boolean {
    return this.settings()?.phoneIsWhatsApp ?? false;
  }

  private applyTheme(settings: CompanySettings | null) {
    const rootStyle = this.document.documentElement.style;
    const backgroundColor = this.normalizeHexColor(settings?.backgroundColor, '#f4f4f4');
    const headerColor = this.normalizeHexColor(settings?.headerColor, '#ffffff');
    const buttonColor = this.normalizeHexColor(settings?.buttonColor, '#2563eb');

    rootStyle.setProperty('--app-background-color', backgroundColor);
    rootStyle.setProperty('--app-header-color', headerColor);
    rootStyle.setProperty('--app-header-text-color', this.getContrastColor(headerColor));
    rootStyle.setProperty('--app-button-color', buttonColor);
    rootStyle.setProperty('--app-button-hover-color', this.adjustColor(buttonColor, -20));
    rootStyle.setProperty('--app-button-text-color', this.getContrastColor(buttonColor));
  }

  private mergeSettings(partialSettings: Partial<CompanySettings> | null | undefined) {
    if (!partialSettings) {
      return;
    }

    this.settings.update((currentSettings) => ({
      ...(currentSettings ?? {}),
      ...partialSettings
    }));
  }

  private normalizeHexColor(value: string | null | undefined, fallback: string): string {
    if (!value) {
      return fallback;
    }

    const normalized = value.trim();
    const shortHex = /^#([0-9a-f]{3})$/i;
    const fullHex = /^#([0-9a-f]{6})$/i;

    if (fullHex.test(normalized)) {
      return normalized;
    }

    const shortMatch = normalized.match(shortHex);
    if (!shortMatch) {
      return fallback;
    }

    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  private getContrastColor(hexColor: string): string {
    const { r, g, b } = this.hexToRgb(hexColor);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#111827' : '#f9fafb';
  }

  private adjustColor(hexColor: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(hexColor);

    return this.rgbToHex(
      this.clampColor(r + amount),
      this.clampColor(g + amount),
      this.clampColor(b + amount)
    );
  }

  private hexToRgb(hexColor: string) {
    const normalized = this.normalizeHexColor(hexColor, '#000000').slice(1);

    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16)
    };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private clampColor(value: number): number {
    return Math.min(255, Math.max(0, value));
  }
}
