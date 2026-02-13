import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import {NgIf} from "@angular/common";

interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.component.html',
  imports: [
    NgIf,
    ReactiveFormsModule
  ],
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loading = false;
  alertMessage: AlertMessage | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  /**
   * Initialize reactive forms
   */
  private initForms(): void {
    // Login form
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Register form
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.maxLength(100)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator for password matching
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Toggle between login and register modes
   */
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.alertMessage = null;
    this.resetForms();
  }

  /**
   * Reset forms
   */
  protected resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset();
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  /**
   * Handle login submission
   */
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.alertMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.showAlert('success', response.message);

        // Navigate to main app after successful login
        setTimeout(() => {
          this.router.navigate(['/chat']);
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error.message || 'Error al iniciar sesión';

        // Check for email verification error
        if (errorMsg.includes('verificar') || errorMsg.includes('verify')) {
          this.showAlert('warning', errorMsg);
        } else {
          this.showAlert('error', errorMsg);
        }
      }
    });
  }

  /**
   * Handle register submission
   */
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;
    this.alertMessage = null;

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;
        this.showAlert('success',
          '¡Registro exitoso! 🥕 Por favor revisa tu email para verificar tu cuenta.');

        // Optionally switch to login mode after a delay
        setTimeout(() => {
          this.isLoginMode = true;
          this.resetForms();
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.showAlert('error', error.message || 'Error al registrarse');
      }
    });
  }

  /**
   * Resend verification email
   */
  resendVerification(): void {
    const email = this.isLoginMode
      ? this.loginForm.get('usernameOrEmail')?.value
      : this.registerForm.get('email')?.value;

    if (!email) {
      this.showAlert('error', 'Por favor ingresa tu email');
      return;
    }

    this.loading = true;

    this.authService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.showAlert('success', 'Email de verificación reenviado. Revisa tu bandeja de entrada.');
      },
      error: (error) => {
        this.loading = false;
        this.showAlert('error', error.message || 'Error al reenviar email');
      }
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  /**
   * Show alert message
   */
  private showAlert(type: AlertMessage['type'], message: string): void {
    this.alertMessage = { type, message };

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000);
  }

  /**
   * Close alert manually
   */
  closeAlert(): void {
    this.alertMessage = null;
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if form control has error
   */
  hasError(formGroup: FormGroup, controlName: string, errorType: string): boolean {
    const control = formGroup.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  /**
   * Get form control
   */
  getControl(formGroup: FormGroup, controlName: string) {
    return formGroup.get(controlName);
  }
}
