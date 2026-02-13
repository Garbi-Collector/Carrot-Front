import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import {NgIf} from "@angular/common";

type VerificationStatus = 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss'
})
export class EmailVerificationComponent implements OnInit {
  status: VerificationStatus = 'verifying';
  message = 'Verificando tu email...';
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];

      if (this.token) {
        this.verifyEmail(this.token);
      } else {
        this.status = 'error';
        this.message = 'Token de verificación no encontrado. Por favor revisa el enlace.';
      }
    });
  }

  /**
   * Verify email with token
   */
  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.status = 'success';
        this.message = response.message || '¡Email verificado exitosamente! 🎉';

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.navigateToAuth();
        }, 3000);
      },
      error: (error) => {
        this.status = 'error';
        this.message = error.message || 'Error al verificar el email. El token puede ser inválido o haber expirado.';
      }
    });
  }

  /**
   * Navigate to auth page
   */
  navigateToAuth(): void {
    this.router.navigate(['/auth']);
  }
}
