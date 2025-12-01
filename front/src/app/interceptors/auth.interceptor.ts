import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { LoginService } from '../features/login/login.service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(LoginService);
  const token = auth.getToken();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    tap({
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.log('Token expirado o no autorizado, deslogueando...');
          auth.logout();
          auth.sendToMap();
        }
      },
    }),
  );
};
