// debug.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  testWishlistAdd(productId: string): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log(' TEST: Enviando producto a wishlist');
    console.log(' Token:', token);
    console.log(' ProductId:', productId);

    // Intento 1: Con productId como string
    const body1 = { productId: productId.toString() };
    this.http.post<any>(`${this.apiUrl}/users/wishlist`, body1, { headers })
      .subscribe({
        next: response => console.log(' RESPUESTA 1 (productId como string):', response),
        error: error => console.error(' ERROR 1:', error)
      });

    // Intento 2: Con productId como objeto
    const body2 = { productId: { _id: productId.toString() } };
    this.http.post<any>(`${this.apiUrl}/users/wishlist`, body2, { headers })
      .subscribe({
        next: response => console.log(' RESPUESTA 2 (productId como objeto):', response),
        error: error => console.error(' ERROR 2:', error)
      });
    
    // Intento 3: Con product como objeto completo
    const body3 = { product: { _id: productId.toString(), name: 'Test Product' } };
    this.http.post<any>(`${this.apiUrl}/users/wishlist`, body3, { headers })
      .subscribe({
        next: response => console.log(' RESPUESTA 3 (product como objeto):', response),
        error: error => console.error(' ERROR 3:', error)
      });
  }

  testDirectRequest(): void {
    // Realiza una solicitud GET directa
    const headers = this.authService.getAuthHeaders();
    
    this.http.get<any>(`${this.apiUrl}/users/profile`, { headers })
      .subscribe({
        next: response => console.log(' PERFIL DE USUARIO:', response),
        error: error => console.error(' ERROR OBTENIENDO PERFIL:', error)
      });
  }
}