import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { CompanySettings } from './models/company-settings';
import { SocketService } from '../../../core/services/socket.service';


@Injectable({ providedIn: 'root' })
export class GeneralSettingsService {
  private api = 'http://localhost:3000/company-settings';

  settings = signal<CompanySettings | null>(null);

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.subscribeToSocketUpdates();
  }

  private subscribeToSocketUpdates() {
    this.socketService.settingsUpdated$.subscribe((updatedSettings: CompanySettings) => {
      this.settings.set(updatedSettings);
    });
  }

  loadSettings() {
    return this.http.get<CompanySettings>(this.api).pipe(
      tap((res) => this.settings.set(res))
    );
  }

  saveSettings(settings: Partial<CompanySettings>) {
    return this.http.patch<CompanySettings>(this.api, settings).pipe(
      tap((res) => this.settings.set(res))
    );
  }

  uploadLogo(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('logo', imageBlob, 'logo.png');

    return this.http.patch<CompanySettings>(`${this.api}/logo`, formData).pipe(
      tap((res) => this.settings.set(res))
    );
  }

  uploadInfoMarkerIcon(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('infoMarkerIcon', imageBlob, 'info-marker-icon.png');

    return this.http.patch<CompanySettings>(`${this.api}/info-marker-icon`, formData).pipe(
      tap((res) => this.settings.set(res))
    );
  }

  uploadTouristMarkerIcon(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('touristMarkerIcon', imageBlob, 'tourist-marker-icon.png');

    return this.http.patch<CompanySettings>(`${this.api}/tourist-marker-icon`, formData).pipe(
      tap((res) => this.settings.set(res))
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
}
