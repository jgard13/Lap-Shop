import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();

  let authReq = req;

  // Clonar la petición e insertar la cabecera de autorización si hay un token activo
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        // Si el servidor responde 401 (No autorizado/Token expirado), cerramos la sesión y redirigimos al login
        if (error.status === 401) {
          authService.cerrarSesion();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
