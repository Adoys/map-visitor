import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export interface CompanySettings {
  name: string;
  logoUrl?: string | null;
  logoBase64?: string | null;
  phone?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CompanySettingsService {

  settings = signal<CompanySettings | null>(null);

  constructor(private http: HttpClient) {}

  loadSettings() {
    return this.http.get<CompanySettings>('/api/company/settings').pipe(
      tap((res) => this.settings.set(res))
    );
  }

  getLogo(): string | null {
    const s = this.settings();
    if (!s) return null;

    if (s.logoUrl) return s.logoUrl;
    if (s.logoBase64) return `data:image/png;base64,${s.logoBase64}`;

    return null;
  }

  getPhone(): string | null {
    return this.settings()?.phone ?? null;
  }
}
