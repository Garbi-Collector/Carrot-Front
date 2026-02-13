import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserRegistrationDTO } from '../models/UserRegistrationDTO';
import { UserLoginDTO } from '../models/UserLoginDTO';
import { AuthResponseDTO } from '../models/AuthResponseDTO';
import { ApiResponseDTO } from '../models/ApiResponseDTO';
import { UserDTO } from '../models/UserDTO';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8088/api/auth';
  private readonly TOKEN_KEY = 'carrot_auth_token';
  private readonly USER_KEY = 'carrot_user';

  private currentUserSubject = new BehaviorSubject<UserDTO | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Register a new user
   */
  register(data: UserRegistrationDTO): Observable<ApiResponseDTO<AuthResponseDTO>> {
    return this.http.post<ApiResponseDTO<AuthResponseDTO>>(`${this.API_URL}/register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data.user) {
            // Don't store token yet (user needs to verify email)
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Login user
   */
  login(data: UserLoginDTO): Observable<ApiResponseDTO<AuthResponseDTO>> {
    return this.http.post<ApiResponseDTO<AuthResponseDTO>>(`${this.API_URL}/login`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data.token) {
            this.setSession(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Observable<ApiResponseDTO<void>> {
    const params = new HttpParams().set('token', token);
    return this.http.get<ApiResponseDTO<void>>(`${this.API_URL}/verify`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(email: string): Observable<ApiResponseDTO<void>> {
    const params = new HttpParams().set('email', email);
    return this.http.post<ApiResponseDTO<void>>(`${this.API_URL}/resend-verification`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Logout current user
   */
  logout(): Observable<ApiResponseDTO<void>> {
    return this.http.post<ApiResponseDTO<void>>(`${this.API_URL}/logout`, null)
      .pipe(
        tap(() => this.clearSession()),
        catchError(err => {
          // Clear session even if API call fails
          this.clearSession();
          return throwError(() => err);
        })
      );
  }

  /**
   * Get current user info
   */
  getCurrentUser(): Observable<ApiResponseDTO<UserDTO>> {
    return this.http.get<ApiResponseDTO<UserDTO>>(`${this.API_URL}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
            this.saveUserToStorage(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Set authentication session
   */
  private setSession(authResult: AuthResponseDTO): void {
    if (authResult.token) {
      localStorage.setItem(this.TOKEN_KEY, authResult.token);
    }
    if (authResult.user) {
      this.saveUserToStorage(authResult.user);
      this.currentUserSubject.next(authResult.user);
    }
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Clear authentication session
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth']);
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user has token
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage(user: UserDTO): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): UserDTO | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  isAuthenticatedValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error. Por favor intenta de nuevo.';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Auth Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
