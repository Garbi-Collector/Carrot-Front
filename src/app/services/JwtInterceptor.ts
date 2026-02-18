import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './AuthService';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  console.log('🥕 Interceptor fired:', req.url);
  console.log('🥕 Token:', token ? token.substring(0, 20) + '...' : 'NULL');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      console.log('🥕 Error status:', error.status, 'URL:', req.url);
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        localStorage.removeItem('carrot_auth_token');
        localStorage.removeItem('carrot_user');
        router.navigate(['/auth']);
      }
      return throwError(() => error);
    })
  );
};
