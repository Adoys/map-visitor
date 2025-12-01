import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { LoginService } from '../features/login/login.service';

export const authGuard: CanActivateFn = (route, state) => {

  const auth = inject(LoginService);
  const router = inject(Router);

  // 1. No autenticado → login
  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const expectedRoles = route.data?.['roles'] as string[] | undefined;
  const userRole = auth.userRole();

  // 2. Tiene token, pero rol incorrecto → unauthorized
  if (expectedRoles && (!userRole || !expectedRoles.includes(userRole))) {
    return router.parseUrl('/unauthorized');
  }

  // 3. Todo OK → continúa
  return true;
};
