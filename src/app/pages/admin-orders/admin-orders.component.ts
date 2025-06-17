import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName?: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentInfo: {
    method: string;
    last4: string;
    cardType: string;
  };
  shippingMethod: string;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedSize?: string;
  total: number;
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
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder: Order | null = null;
  
  // Estados
  isLoading = false;
  error = '';
  successMessage = '';
  
  // Filtros
  filterStatus = 'all';
  filterSearch = '';
  filterDateFrom = '';
  filterDateTo = '';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Modal
  showOrderModal = false;
  showStatusModal = false;
  newStatus = '';
  newTrackingNumber = '';
  
  // Estadísticas
  stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('📋 Inicializando AdminOrdersComponent...');
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  //  CARGAR ÓRDENES (por ahora mock, mañana conectamos con API)
  loadOrders(): void {
    this.isLoading = true;
    console.log(' Cargando órdenes...');
    
    // Simular delay de API
    setTimeout(() => {
      // MOCK DATA - Mañana reemplazaremos con llamada real a la API
      this.orders = this.generateMockOrders();
      this.applyFilters();
      this.calculateStats();
      this.isLoading = false;
      console.log(' Órdenes cargadas:', this.orders.length);
    }, 1000);
  }

  //  GENERAR DATOS MOCK (temporal)
  private generateMockOrders(): Order[] {
    const statuses: Array<Order['status']> = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['credit_card', 'debit_card', 'paypal'];
    const shippingMethods = ['standard', 'express'];
    
    return Array.from({ length: 25 }, (_, i) => {
      const orderNumber = `ORD-${Date.now() - (i * 86400000)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const subtotal = Math.floor(Math.random() * 200) + 50;
      const shipping = Math.random() > 0.3 ? 5.99 : 0;
      const tax = subtotal * 0.21;
      const total = subtotal + shipping + tax;
      
      return {
        _id: `order_${i + 1}`,
        orderNumber,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        userEmail: `usuario${Math.floor(Math.random() * 10) + 1}@email.com`,
        userName: `Usuario ${Math.floor(Math.random() * 10) + 1}`,
        items: Array.from({ length: itemCount }, (_, j) => ({
          productId: `prod_${j + 1}`,
          productName: `Producto ${j + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: Math.floor(Math.random() * 50) + 20,
          selectedSize: Math.random() > 0.5 ? ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)] : undefined,
          total: Math.floor(Math.random() * 100) + 30
        })),
        shippingAddress: {
          name: `Dirección ${i + 1}`,
          address: `Calle ${i + 1}, ${Math.floor(Math.random() * 100) + 1}`,
          city: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'][Math.floor(Math.random() * 4)],
          state: ['Madrid', 'Cataluña', 'Valencia', 'Andalucía'][Math.floor(Math.random() * 4)],
          zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: 'España'
        },
        paymentInfo: {
          method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          last4: Math.floor(Math.random() * 9000 + 1000).toString(),
          cardType: ['Visa', 'Mastercard', 'American Express'][Math.floor(Math.random() * 3)]
        },
        shippingMethod: shippingMethods[Math.floor(Math.random() * shippingMethods.length)],
        pricing: {
          subtotal,
          shipping,
          tax,
          total
        },
        status,
        trackingNumber: status === 'shipped' || status === 'delivered' ? `TRK${Math.floor(Math.random() * 1000000000)}` : undefined,
        createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
        updatedAt: new Date(Date.now() - (i * 43200000)).toISOString()
      };
    });
  }

  //  APLICAR FILTROS
  applyFilters(): void {
    let filtered = [...this.orders];
    
    // Filtro por estado
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.filterStatus);
    }
    
    // Filtro por búsqueda
    if (this.filterSearch.trim()) {
      const search = this.filterSearch.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search) ||
        order.userName?.toLowerCase().includes(search)
      );
    }
    
    // Filtro por fecha
    if (this.filterDateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(this.filterDateFrom)
      );
    }
    
    if (this.filterDateTo) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(this.filterDateTo + 'T23:59:59')
      );
    }
    
    this.filteredOrders = filtered;
    this.calculatePagination();
  }

  //  CALCULAR PAGINACIÓN
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  //  OBTENER ÓRDENES DE LA PÁGINA ACTUAL
  getCurrentPageOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  //  CALCULAR ESTADÍSTICAS
  calculateStats(): void {
    this.stats.total = this.orders.length;
    this.stats.pending = this.orders.filter(o => o.status === 'pending').length;
    this.stats.confirmed = this.orders.filter(o => o.status === 'confirmed').length;
    this.stats.processing = this.orders.filter(o => o.status === 'processing').length;
    this.stats.shipped = this.orders.filter(o => o.status === 'shipped').length;
    this.stats.delivered = this.orders.filter(o => o.status === 'delivered').length;
    this.stats.cancelled = this.orders.filter(o => o.status === 'cancelled').length;
    this.stats.totalRevenue = this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.pricing.total, 0);
  }

  //  NAVEGACIÓN DE PÁGINAS
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  //  GESTIÓN DE ÓRDENES
  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  editOrderStatus(order: Order): void {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.newTrackingNumber = order.trackingNumber || '';
    this.showStatusModal = true;
  }

  updateOrderStatus(): void {
    if (!this.selectedOrder) return;
    
    console.log(' Actualizando estado de orden:', this.selectedOrder.orderNumber);
    
    // TODO: Mañana conectar con API real
    // Por ahora actualizar mock data
    const orderIndex = this.orders.findIndex(o => o._id === this.selectedOrder!._id);
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = this.newStatus as Order['status'];
      this.orders[orderIndex].trackingNumber = this.newTrackingNumber || undefined;
      this.orders[orderIndex].updatedAt = new Date().toISOString();
    }
    
    this.applyFilters();
    this.calculateStats();
    this.closeModals();
    this.successMessage = 'Estado de orden actualizado exitosamente';
    
    setTimeout(() => this.successMessage = '', 3000);
  }

  deleteOrder(order: Order): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la orden ${order.orderNumber}?`)) {
      console.log(' Eliminando orden:', order.orderNumber);
      
      // TODO: Mañana conectar con API real
      this.orders = this.orders.filter(o => o._id !== order._id);
      this.applyFilters();
      this.calculateStats();
      
      this.successMessage = 'Orden eliminada exitosamente';
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  //  UTILIDADES
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
    this.applyFilters();
  }

  exportOrders(): void {
    console.log(' Exportando órdenes...');
    // TODO: Implementar exportación
    alert('Función de exportación en desarrollo');
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  //  GETTERS PARA TEMPLATES
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return classes[status] || 'status-default';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      processing: 'Procesando',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada'
    };
    return texts[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  //  MÉTODO PARA NAVEGAR A PRODUCTOS
  goToProductManagement(): void {
    this.router.navigate(['/admin/products']);
  }
}