import { Injectable } from '@angular/core';

interface FailedAttempt {
  count: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

interface RateLimitState {
  usernameAttempts: Map<string, FailedAttempt>;
  ipAttempts: Map<string, FailedAttempt>;
}

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private readonly MAX_ATTEMPTS = 10;
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos
  private readonly ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  private readonly STORAGE_KEY = 'login_rate_limit';

  private state: RateLimitState;

  constructor() {
    this.state = this.loadState();
    this.cleanupExpiredBlocks();
  }

  /**
   * Verifica si un usuario está bloqueado
   */
  isUsernameBlocked(username: string): { blocked: boolean; remainingMinutes?: number } {
    const attempt = this.state.usernameAttempts.get(username);

    if (!attempt) {
      return { blocked: false };
    }

    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      const remainingMs = attempt.blockedUntil - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return { blocked: true, remainingMinutes };
    }

    // Si el bloqueo expiró, limpiar
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
      this.state.usernameAttempts.delete(username);
      this.saveState();
    }

    return { blocked: false };
  }

  /**
   * Verifica si una IP está bloqueada
   */
  isIpBlocked(ip: string): { blocked: boolean; remainingMinutes?: number } {
    const attempt = this.state.ipAttempts.get(ip);

    if (!attempt) {
      return { blocked: false };
    }

    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      const remainingMs = attempt.blockedUntil - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return { blocked: true, remainingMinutes };
    }

    // Si el bloqueo expiró, limpiar
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
      this.state.ipAttempts.delete(ip);
      this.saveState();
    }

    return { blocked: false };
  }

  /**
   * Registra un intento fallido de login
   */
  recordFailedAttempt(username: string, ip: string): { usernameBlocked: boolean; ipBlocked: boolean } {
    const now = Date.now();
    let usernameBlocked = false;
    let ipBlocked = false;

    // Registrar intento para el username
    const usernameAttempt = this.state.usernameAttempts.get(username);
    if (usernameAttempt) {
      // Verificar si estamos dentro de la ventana de tiempo
      if (now - usernameAttempt.firstAttemptTime > this.ATTEMPT_WINDOW_MS) {
        // Reiniciar contador si pasó el tiempo
        this.state.usernameAttempts.set(username, {
          count: 1,
          firstAttemptTime: now,
          blockedUntil: null
        });
      } else {
        usernameAttempt.count++;
        if (usernameAttempt.count >= this.MAX_ATTEMPTS) {
          usernameAttempt.blockedUntil = now + this.BLOCK_DURATION_MS;
          usernameBlocked = true;
        }
      }
    } else {
      this.state.usernameAttempts.set(username, {
        count: 1,
        firstAttemptTime: now,
        blockedUntil: null
      });
    }

    // Registrar intento para la IP
    const ipAttempt = this.state.ipAttempts.get(ip);
    if (ipAttempt) {
      if (now - ipAttempt.firstAttemptTime > this.ATTEMPT_WINDOW_MS) {
        this.state.ipAttempts.set(ip, {
          count: 1,
          firstAttemptTime: now,
          blockedUntil: null
        });
      } else {
        ipAttempt.count++;
        if (ipAttempt.count >= this.MAX_ATTEMPTS) {
          ipAttempt.blockedUntil = now + this.BLOCK_DURATION_MS;
          ipBlocked = true;
        }
      }
    } else {
      this.state.ipAttempts.set(ip, {
        count: 1,
        firstAttemptTime: now,
        blockedUntil: null
      });
    }

    this.saveState();
    return { usernameBlocked, ipBlocked };
  }

  /**
   * Limpia los intentos fallidos después de un login exitoso
   */
  clearAttempts(username: string, ip: string): void {
    this.state.usernameAttempts.delete(username);
    this.state.ipAttempts.delete(ip);
    this.saveState();
  }

  /**
   * Obtiene el número de intentos restantes para un usuario
   */
  getRemainingAttempts(username: string): number {
    const attempt = this.state.usernameAttempts.get(username);
    if (!attempt) return this.MAX_ATTEMPTS;

    const now = Date.now();
    if (now - attempt.firstAttemptTime > this.ATTEMPT_WINDOW_MS) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - attempt.count);
  }

  /**
   * Obtiene una IP única (simulada ya que en frontend no tenemos acceso real a la IP)
   */
  getClientIdentifier(): string {
    // En un entorno real, esto vendría del backend
    // Aquí usamos una combinación de userAgent + screen para tener algo único por dispositivo
    const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}-${screen.colorDepth}`;
    return this.hashString(fingerprint);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private loadState(): RateLimitState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          usernameAttempts: new Map(Object.entries(parsed.usernameAttempts || {})),
          ipAttempts: new Map(Object.entries(parsed.ipAttempts || {}))
        };
      }
    } catch {
      // Ignorar errores de parsing
    }
    return {
      usernameAttempts: new Map(),
      ipAttempts: new Map()
    };
  }

  private saveState(): void {
    const toSave = {
      usernameAttempts: Object.fromEntries(this.state.usernameAttempts),
      ipAttempts: Object.fromEntries(this.state.ipAttempts)
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
  }

  private cleanupExpiredBlocks(): void {
    const now = Date.now();

    // Limpiar bloqueos expirados de usuarios
    for (const [username, attempt] of this.state.usernameAttempts.entries()) {
      if (attempt.blockedUntil && now >= attempt.blockedUntil) {
        this.state.usernameAttempts.delete(username);
      } else if (now - attempt.firstAttemptTime > this.ATTEMPT_WINDOW_MS && !attempt.blockedUntil) {
        // Limpiar intentos antiguos que no resultaron en bloqueo
        this.state.usernameAttempts.delete(username);
      }
    }

    // Limpiar bloqueos expirados de IPs
    for (const [ip, attempt] of this.state.ipAttempts.entries()) {
      if (attempt.blockedUntil && now >= attempt.blockedUntil) {
        this.state.ipAttempts.delete(ip);
      } else if (now - attempt.firstAttemptTime > this.ATTEMPT_WINDOW_MS && !attempt.blockedUntil) {
        this.state.ipAttempts.delete(ip);
      }
    }

    this.saveState();
  }
}
