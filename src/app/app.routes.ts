import { Routes } from '@angular/router';
import { authGuard } from './services/AuthGuard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'auth/verify',
    loadComponent: () => import('./pages/email-verification/email-verification.component').then(m => m.EmailVerificationComponent)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent)
    // Crearás este componente después
  },
  {
    path: '**',
    redirectTo: '/auth'
  }
];
