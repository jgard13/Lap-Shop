import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../Services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // En el servidor no hay localStorage — dejar pasar, el cliente verificará
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);
  const authService = inject(AuthService);
  const user = authService.obtenerUsuarioActual();

  if (authService.estaAutenticado() && user && user.rol === 'admin') {
    return true;
  }

  router.navigate(['/']);
  return false;
};
