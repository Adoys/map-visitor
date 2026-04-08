import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { LoginService } from '../features/login/login.service';
import { tap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(LoginService);
  const messageService = inject(MessageService);

  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Verificar proactivamente si el token está expirado ANTES de enviar la petición
  if (!auth.isAuthenticated()) {
    auth.logout();
    auth.sendToMap();

    messageService.add({
      severity: 'warn',
      summary: 'Sesión caducada/invalida',
      detail: 'Tu sesión ha expirado. Vuelve a iniciar sesión.',
    });

    return throwError(() => new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: 'Token expirado'
    }));
  }

  const token = auth.getToken();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    tap({
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          auth.logout();
          auth.sendToMap();

          messageService.add({
            severity: 'warn',
            summary: 'Sesión caducada/invalida',
            detail: 'Tu sesión ha expirado. Vuelve a iniciar sesión.',
          });
        } else if (err.status === 403) {
          messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: 'No tienes permisos para realizar esta acción.',
          });

        } else if (err.status === 0) {
          messageService.add({
            severity: 'error',
            summary: 'Error de red',
            detail: 'No se pudo conectar con el servidor.',
          });

        } else if (err.status >= 500) {
          messageService.add({
            severity: 'error',
            summary: 'Error del servidor',
            detail: 'Se produjo un error interno. Inténtalo más tarde.',
          });
        }
      },
    }),
  );
};

