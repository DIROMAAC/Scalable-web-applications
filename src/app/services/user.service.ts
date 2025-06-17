import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserAddress, PaymentMethod } from '../interfaces/product.interface';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;
  
  private addressesSubject = new BehaviorSubject<UserAddress[]>([]);
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  
  public addresses$ = this.addressesSubject.asObservable();
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log(' UserService inicializado');
    this.loadUserData();
  }

  // Cargar datos del usuario
  private loadUserData(): void {
    if (this.authService.isAuthenticated) {
      this.loadUserProfile().subscribe();
    }
  }

  // Cargar perfil del usuario
  loadUserProfile(): Observable<any> {
    if (!this.authService.isAuthenticated) {
      return of(null);
    }

    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/users/profile`, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.user) {
            console.log(' Perfil del usuario cargado:', response.user);
            
            //  CARGAR DIRECCIONES Y MÉTODOS DE PAGO
            if (response.user.addresses) {
              this.addressesSubject.next(response.user.addresses);
              console.log(' Direcciones cargadas:', response.user.addresses.length);
            }
            
            if (response.user.paymentMethods) {
              this.paymentMethodsSubject.next(response.user.paymentMethods);
              console.log(' Métodos de pago cargados:', response.user.paymentMethods.length);
            }
            
            return response.user;
          }
          return null;
        }),
        catchError(error => {
          console.warn(' Error cargando perfil de usuario:', error);
          return of(null);
        })
      );
  }

  // Actualizar perfil del usuario
  updateUserProfile(profileData: any): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/users/profile`, profileData, { headers })
      .pipe(
        catchError(error => {
          console.error(' Error actualizando perfil:', error);
          throw error.error?.msg || 'Error al actualizar perfil';
        })
      );
  }

  // Gestión de direcciones
  addAddress(address: any): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/users/addresses`, address, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.addresses) {
            this.addressesSubject.next(response.addresses);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error añadiendo dirección:', error);
          throw error.error?.msg || 'Error al añadir dirección';
        })
      );
  }

  updateAddress(addressId: string, address: any): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/users/addresses/${addressId}`, address, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.addresses) {
            this.addressesSubject.next(response.addresses);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error actualizando dirección:', error);
          throw error.error?.msg || 'Error al actualizar dirección';
        })
      );
  }

  deleteAddress(addressId: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.delete<any>(`${this.apiUrl}/users/addresses/${addressId}`, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.addresses) {
            this.addressesSubject.next(response.addresses);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error eliminando dirección:', error);
          throw error.error?.msg || 'Error al eliminar dirección';
        })
      );
  }

  // Gestión de métodos de pago
  addPaymentMethod(paymentMethod: any): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/users/payment-methods`, paymentMethod, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.paymentMethods) {
            this.paymentMethodsSubject.next(response.paymentMethods);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error añadiendo método de pago:', error);
          throw error.error?.msg || 'Error al añadir método de pago';
        })
      );
  }

  deletePaymentMethod(paymentId: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.delete<any>(`${this.apiUrl}/users/payment-methods/${paymentId}`, { headers })
      .pipe(
        map(response => {
          if (response?.ok && response.paymentMethods) {
            this.paymentMethodsSubject.next(response.paymentMethods);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error eliminando método de pago:', error);
          throw error.error?.msg || 'Error al eliminar método de pago';
        })
      );
  }
}