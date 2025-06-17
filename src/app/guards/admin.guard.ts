import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated && authService.isAdmin) {
    return true;
  }

  // Si no está autenticado, ir al login
  if (!authService.isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  // Si está autenticado pero no es admin, ir al inicio
  router.navigate(['/']);
  return false;
};