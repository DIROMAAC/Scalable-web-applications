import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../environment/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  fullName: string;
  initials: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
}

export interface AuthResponse {
  ok: boolean;
  msg: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log(' AuthService inicializado con API URL:', this.apiUrl);
    
    if (this.isBrowser()) {
      this.checkStoredToken();
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  private checkStoredToken(): void {
    const token = this.getToken();
    const userData = this.getStoredUserData();
    
    if (token && userData) {
      console.log(' Token y datos de usuario encontrados en localStorage');
      this.currentUserSubject.next(userData);
      this.isAuthenticatedSubject.next(true);
    }
  }

  //  LOGIN MEJORADO CON MEJOR MANEJO DE ERRORES
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log(' Intentando hacer login con URL:', `${this.apiUrl}/auth/login`);
    console.log(' Credenciales:', { email: credentials.email, password: '***' });
    
    // Verificar que la URL esté correcta
    if (!this.apiUrl) {
      console.error(' API URL no configurada');
      return throwError(() => 'Error de configuración: API URL no definida');
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials, httpOptions)
      .pipe(
        timeout(15000), //  Timeout de 15 segundos
        retry(1), //  Reintentar una vez si falla
        map(response => {
          console.log(' Respuesta de login:', response);
          
          if (response.ok && response.token && response.user) {
            console.log(' Login exitoso');
            this.setToken(response.token);
            this.setUserData(response.user);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
          
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(' Error completo en login:', error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  //  REGISTER MEJORADO
  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log(' Intentando registrar usuario con URL:', `${this.apiUrl}/auth/register`);
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData, httpOptions)
      .pipe(
        timeout(15000),
        retry(1),
        map(response => {
          console.log(' Respuesta de registro:', response);
          
          if (response.ok && response.token && response.user) {
            console.log(' Registro exitoso');
            this.setToken(response.token);
            this.setUserData(response.user);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
          
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(' Error en registro:', error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  verifyToken(): Observable<AuthResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/verify`, { headers })
      .pipe(
        timeout(10000),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    const headers = this.getAuthHeaders();
    const body = {
      currentPassword,
      newPassword
    };
    
    return this.http.put<AuthResponse>(`${this.apiUrl}/auth/change-password`, body, { headers })
      .pipe(
        timeout(10000),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  logout(): void {
    console.log(' Cerrando sesión...');
    
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    this.router.navigate(['/']);
    console.log(' Sesión cerrada');
  }

  setToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem('token');
  }

  removeToken(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
    }
  }

  private setUserData(user: User): void {
    if (this.isBrowser()) {
      localStorage.setItem('userData', JSON.stringify(user));
    }
  }

  private getStoredUserData(): User | null {
    if (!this.isBrowser()) {
      return null;
    }
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  private updateUserData(user: User): void {
    this.setUserData(user);
    this.currentUserSubject.next(user);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  //  MANEJO DE ERRORES MEJORADO
  private handleError(error: HttpErrorResponse): string {
    console.error(' Error HTTP completo:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    
    // Error 0 significa problema de conexión
    if (error.status === 0) {
      console.error(' Error de conexión - Verificar:');
      console.error('   1. Servidor backend corriendo en puerto 8080');
      console.error('   2. CORS configurado correctamente');
      console.error('   3. URL de API correcta:', this.apiUrl);
      return 'Error de conexión. Verifica que el servidor esté funcionando.';
    }
    
    // Errores del servidor
    if (error.error?.msg) {
      return error.error.msg;
    }
    
    if (error.message) {
      return error.message;
    }
    
    switch (error.status) {
      case 400:
        return 'Datos inválidos';
      case 401:
        return 'Credenciales inválidas';
      case 403:
        return 'Acceso denegado';
      case 404:
        return 'Servicio no encontrado';
      case 500:
        return 'Error interno del servidor';
      default:
        return `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
    }
  }

  //  MÉTODO PARA PROBAR CONEXIÓN
  testConnection(): Observable<any> {
    console.log(' Probando conexión con:', `${this.apiUrl.replace('/api', '')}/`);
    
    return this.http.get(`${this.apiUrl.replace('/api', '')}/`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      timeout(10000),
      catchError((error: HttpErrorResponse) => {
        console.error(' Error de conexión:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }
}