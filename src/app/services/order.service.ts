import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Order, UserAddress, ShippingMethod, CheckoutPaymentOption } from '../interfaces/product.interface';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
    selectedSize?: string;
    unitPrice: number;
  }[];
  shippingAddress: UserAddress;
  paymentInfo: {
    method: string;
    last4?: string;
    cardType?: string;
    transactionId?: string;
  };
  shippingMethod?: string;
}

export interface OrderResponse {
  ok: boolean;
  msg?: string;
  order?: Order;
  orders?: Order[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = environment.apiUrl;
  private userOrdersSubject = new BehaviorSubject<Order[]>([]);
  
  public userOrders$ = this.userOrdersSubject.asObservable();

  // Opciones de envío disponibles
  public shippingMethods: ShippingMethod[] = [
    {
      id: 'standard',
      name: 'Envío Estándar',
      price: 5.99,
      estimatedDays: '3-5 días',
      description: 'Entrega en 3-5 días laborables'
    },
    {
      id: 'express',
      name: 'Envío Express',
      price: 12.99,
      estimatedDays: '1-2 días',
      description: 'Entrega en 1-2 días laborables'
    },
    {
      id: 'overnight',
      name: 'Entrega al Día Siguiente',
      price: 19.99,
      estimatedDays: '1 día',
      description: 'Entrega al día siguiente (pedidos antes de 14:00h)'
    }
  ];

  // Opciones de pago disponibles
  public paymentOptions: CheckoutPaymentOption[] = [
    {
      id: 'credit_card',
      name: 'Tarjeta de Crédito',
      type: 'credit',
      fee: 0
    },
    {
      id: 'debit_card',
      name: 'Tarjeta de Débito',
      type: 'debit',
      fee: 0
    },
    {
      id: 'paypal',
      name: 'PayPal',
      type: 'paypal',
      fee: 0
    }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log(' OrderService inicializado');
  }

  //  Crear nueva orden
  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    console.log(' Creando nueva orden:', orderData);
    
    const headers = this.authService.getAuthHeaders();
    
    return this.http.post<OrderResponse>(`${this.apiUrl}/orders`, orderData, { headers })
      .pipe(
        map(response => {
          if (!response.ok || !response.order) {
            throw new Error(response.msg || 'Error creando orden');
          }
          
          console.log(' Orden creada exitosamente:', response.order);
          return response.order;
        }),
        catchError(error => {
          console.error(' Error creando orden:', error);
          throw error.error?.msg || 'Error al crear la orden';
        })
      );
  }

  //  Obtener órdenes del usuario
  getUserOrders(page: number = 1, limit: number = 10, status?: string): Observable<OrderResponse> {
    const headers = this.authService.getAuthHeaders();
    let params = `?page=${page}&limit=${limit}`;
    
    if (status) {
      params += `&status=${status}`;
    }
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders${params}`, { headers })
      .pipe(
        map(response => {
          if (response.ok && response.orders) {
            this.userOrdersSubject.next(response.orders);
          }
          return response;
        }),
        catchError(error => {
          console.error(' Error obteniendo órdenes:', error);
          throw error.error?.msg || 'Error al obtener las órdenes';
        })
      );
  }

  //  Obtener orden específica
  getOrder(orderId: string): Observable<Order> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/${orderId}`, { headers })
      .pipe(
        map(response => {
          if (!response.ok || !response.order) {
            throw new Error(response.msg || 'Orden no encontrada');
          }
          return response.order;
        }),
        catchError(error => {
          console.error(' Error obteniendo orden:', error);
          throw error.error?.msg || 'Error al obtener la orden';
        })
      );
  }

  //  Cancelar orden
  cancelOrder(orderId: string): Observable<Order> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<OrderResponse>(`${this.apiUrl}/orders/${orderId}/cancel`, {}, { headers })
      .pipe(
        map(response => {
          if (!response.ok || !response.order) {
            throw new Error(response.msg || 'Error cancelando orden');
          }
          
          console.log(' Orden cancelada:', response.order);
          return response.order;
        }),
        catchError(error => {
          console.error(' Error cancelando orden:', error);
          throw error.error?.msg || 'Error al cancelar la orden';
        })
      );
  }

  //  MÉTODOS PARA ADMIN

  // Obtener todas las órdenes (admin)
  getAllOrders(
    page: number = 1, 
    limit: number = 20, 
    filters?: {
      status?: string;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Observable<OrderResponse> {
    const headers = this.authService.getAuthHeaders();
    
    let params = `?page=${page}&limit=${limit}`;
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params += `&${key}=${encodeURIComponent(value)}`;
        }
      });
    }
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/admin/all${params}`, { headers })
      .pipe(
        catchError(error => {
          console.error(' Error obteniendo todas las órdenes:', error);
          throw error.error?.msg || 'Error al obtener las órdenes';
        })
      );
  }

  // Actualizar estado de orden (admin)
  updateOrderStatus(
    orderId: string, 
    updateData: {
      status?: string;
      trackingNumber?: string;
      adminNotes?: string;
    }
  ): Observable<Order> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.put<OrderResponse>(`${this.apiUrl}/orders/admin/${orderId}`, updateData, { headers })
      .pipe(
        map(response => {
          if (!response.ok || !response.order) {
            throw new Error(response.msg || 'Error actualizando orden');
          }
          
          console.log(' Orden actualizada:', response.order);
          return response.order;
        }),
        catchError(error => {
          console.error(' Error actualizando orden:', error);
          throw error.error?.msg || 'Error al actualizar la orden';
        })
      );
  }

  // Obtener estadísticas de órdenes (admin)
  getOrderStats(): Observable<{ stats: OrderStats; monthlyStats: any[] }> {
    const headers = this.authService.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/orders/admin/stats`, { headers })
      .pipe(
        map(response => {
          if (!response.ok) {
            throw new Error(response.msg || 'Error obteniendo estadísticas');
          }
          return {
            stats: response.stats,
            monthlyStats: response.monthlyStats
          };
        }),
        catchError(error => {
          console.error(' Error obteniendo estadísticas:', error);
          throw error.error?.msg || 'Error al obtener estadísticas';
        })
      );
  }

  //  MÉTODOS HELPER

  // Obtener método de envío por ID
  getShippingMethod(methodId: string): ShippingMethod | null {
    return this.shippingMethods.find(method => method.id === methodId) || null;
  }

  // Obtener opción de pago por ID
  getPaymentOption(optionId: string): CheckoutPaymentOption | null {
    return this.paymentOptions.find(option => option.id === optionId) || null;
  }

  // Calcular costo de envío
  calculateShippingCost(subtotal: number, methodId: string = 'standard'): number {
    // Envío gratuito para pedidos >= 100€
    if (subtotal >= 100) {
      return 0;
    }
    
    const method = this.getShippingMethod(methodId);
    return method ? method.price : 5.99;
  }

  // Formatear estado de orden para mostrar
  formatOrderStatus(status: string): { label: string; color: string } {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      'pending': { label: 'Pendiente', color: '#ffc107' },
      'processing': { label: 'Procesando', color: '#17a2b8' },
      'shipped': { label: 'Enviado', color: '#28a745' },
      'delivered': { label: 'Entregado', color: '#007bff' },
      'cancelled': { label: 'Cancelado', color: '#dc3545' }
    };
    
    return statusMap[status] || { label: status, color: '#6c757d' };
  }

  // Verificar si una orden se puede cancelar
  canCancelOrder(order: Order): boolean {
    return ['pending', 'processing'].includes(order.status);
  }

  // Obtener días transcurridos desde la orden
  getDaysSinceOrder(orderDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(orderDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}