import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtener token
  let token = null;
  try {
    if (typeof localStorage !== 'undefined') {
      token = localStorage.getItem('token');
    }
  } catch (e) {
    console.warn('localStorage no está disponible en este entorno');
  }
  
  // Clonar la request y añadir headers de autorización
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  // Procesar la request y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(' Error HTTP:', error.status, error.message);
      
      // Si el error es 401 (No autorizado), hacer logout
      if (error.status === 401) {
        console.log(' Token expirado o inválido, cerrando sesión...');
        authService.logout();
        router.navigate(['/login']);
      }
      
      // Si el error es 403 (Prohibido), redirigir al inicio
      if (error.status === 403) {
        console.log(' Acceso prohibido, redirigiendo...');
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};