import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private apiUrl = 'http://localhost:3000/auth';
  userRole = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      this.userRole.set(decoded?.role || null);
    }
  }

  login(username: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.access_token);

          const decoded = this.decodeToken(response.access_token);
          this.userRole.set(decoded?.role || null);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    this.userRole.set(null);
  }

  public sendToMap() {
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    return this.userRole() === 'admin';
  }

  getUserId(): number | null {
    const token = this.getToken();
    const decoded = token ? this.decodeToken(token) : null;
    if (!decoded) {
      return null;
    }
    const id = decoded.userId ?? decoded.sub ?? decoded.id ?? null;
    return typeof id === 'string' ? Number(id) : id;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  }

  requestPasswordReset(username: string): Observable<any> {
    return this.http.post('http://localhost:3000/auth/forgot-password', { username });
  }
}
