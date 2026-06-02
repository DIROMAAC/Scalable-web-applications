import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { OrderService, OrderStats } from '../../services/order.service';

// Interfaz alineada con la estructura real de MongoDB
interface AdminOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  userInfo: {
    email: string;
    firstName: string;
    lastName: string;
  };
  items: AdminOrderItem[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentInfo: {
    method: string;
    last4?: string;
    cardType?: string;
    transactionId?: string;
  };
  shippingMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminOrderItem {
  productId?: string;
  productModel?: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  image?: string;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  // Datos
  orders: AdminOrder[] = [];
  filteredOrders: AdminOrder[] = [];
  selectedOrder: AdminOrder | null = null;

  // Estados
  isLoading = false;
  error = '';
  successMessage = '';

  // Filtros (aplicados en el servidor)
  filterStatus = 'all';
  filterSearch = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Paginación (servidor)
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalOrders = 0;

  // Modal
  showOrderModal = false;
  showStatusModal = false;
  newStatus = '';
  newTrackingNumber = '';
  newAdminNotes = '';
  isSavingStatus = false;

  // Estadísticas
  stats = {
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Cargar órdenes desde la API real
  loadOrders(): void {
    this.isLoading = true;
    this.error = '';

    const filters: any = {};
    if (this.filterStatus !== 'all') filters.status = this.filterStatus;
    if (this.filterSearch.trim())    filters.orderNumber = this.filterSearch.trim();
    if (this.filterDateFrom)         filters.startDate = this.filterDateFrom;
    if (this.filterDateTo)           filters.endDate = this.filterDateTo;

    const sub = this.orderService.getAllOrders(this.currentPage, this.itemsPerPage, filters)
      .subscribe({
        next: (response) => {
          if (response.ok && response.orders) {
            this.orders = response.orders as unknown as AdminOrder[];
            this.filteredOrders = this.orders;
            this.totalOrders = response.pagination?.totalOrders ?? this.orders.length;
            this.totalPages  = response.pagination?.totalPages ?? 1;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando órdenes:', err);
          this.error = typeof err === 'string' ? err : 'Error al cargar las órdenes del servidor';
          this.isLoading = false;
        }
      });

    this.subscriptions.push(sub);
  }

  // Cargar estadísticas globales desde la API
  loadStats(): void {
    const sub = this.orderService.getOrderStats().subscribe({
      next: (data) => {
        const s = data.stats;
        this.stats.total        = s.totalOrders;
        this.stats.pending      = s.pendingOrders;
        this.stats.processing   = s.processingOrders;
        this.stats.shipped      = s.shippedOrders;
        this.stats.delivered    = s.deliveredOrders;
        this.stats.cancelled    = s.cancelledOrders;
        this.stats.totalRevenue = s.totalRevenue;
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
      }
    });
    this.subscriptions.push(sub);
  }

  // Aplicar filtros: recarga desde el servidor con los nuevos parámetros
  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  getCurrentPageOrders(): AdminOrder[] {
    // Con paginación del servidor, el arreglo ya tiene solo la página actual
    return this.orders;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // Ver detalles de una orden
  viewOrder(order: AdminOrder): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  // Abrir modal para cambiar estado
  editOrderStatus(order: AdminOrder): void {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.newTrackingNumber = order.trackingNumber || '';
    this.newAdminNotes = order.adminNotes || '';
    this.showStatusModal = true;
    this.showOrderModal = false;
  }

  // Actualizar estado vía API real
  updateOrderStatus(): void {
    if (!this.selectedOrder) return;

    this.isSavingStatus = true;
    this.error = '';

    const sub = this.orderService.updateOrderStatus(this.selectedOrder._id, {
      status: this.newStatus,
      trackingNumber: this.newTrackingNumber || undefined,
      adminNotes: this.newAdminNotes || undefined
    }).subscribe({
      next: (_updatedOrder) => {
        this.isSavingStatus = false;
        this.closeModals();
        this.successMessage = 'Estado de la orden actualizado exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
        // Recargar lista y estadísticas
        this.loadOrders();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error actualizando orden:', err);
        this.error = typeof err === 'string' ? err : 'Error al actualizar el estado de la orden';
        this.isSavingStatus = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // Utilidades
  closeModals(): void {
    this.showOrderModal = false;
    this.showStatusModal = false;
    this.selectedOrder = null;
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterSearch = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
    this.loadOrders();
  }

  refreshOrders(): void {
    this.loadOrders();
    this.loadStats();
  }

  exportOrders(): void {
    alert('Función de exportación en desarrollo');
  }

  goToProductManagement(): void {
    this.router.navigate(['/admin/products']);
  }

  // Helpers para el template
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending:    'status-pending',
      processing: 'status-processing',
      shipped:    'status-shipped',
      delivered:  'status-delivered',
      cancelled:  'status-cancelled'
    };
    return classes[status] || 'status-default';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      pending:    'Pendiente',
      processing: 'Procesando',
      shipped:    'Enviada',
      delivered:  'Entregada',
      cancelled:  'Cancelada'
    };
    return texts[status] || status;
  }

  getPaymentMethodText(method: string): string {
    const map: { [key: string]: string } = {
      credit_card:    'Tarjeta de Crédito',
      debit_card:     'Tarjeta de Débito',
      paypal:         'PayPal',
      bank_transfer:  'Transferencia Bancaria'
    };
    return map[method] || method;
  }

  getShippingMethodText(method: string): string {
    const map: { [key: string]: string } = {
      standard:  'Estándar',
      express:   'Express',
      overnight: 'Entrega al Día Siguiente'
    };
    return map[method] || method;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount ?? 0);
  }

  getCustomerName(order: AdminOrder): string {
    if (order.userInfo) {
      return `${order.userInfo.firstName} ${order.userInfo.lastName}`.trim();
    }
    return 'Cliente';
  }

  getCustomerEmail(order: AdminOrder): string {
    return order.userInfo?.email ?? '';
  }
}