import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { OrderService } from '../../services/order.service';
import { Order } from '../../interfaces/product.interface';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, DatePipe, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Paginación
  currentPage: number = 1;
  totalPages: number = 1;
  totalOrders: number = 0;
  limit: number = 5;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.orderService.getUserOrders(page, this.limit).subscribe({
      next: (response) => {
        if (response.ok && response.orders) {
          this.orders = response.orders;
          if (response.pagination) {
            this.currentPage = response.pagination.currentPage;
            this.totalPages = response.pagination.totalPages;
            this.totalOrders = response.pagination.totalOrders;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando órdenes:', err);
        this.errorMessage = 'No se pudieron cargar tus pedidos. Por favor, inténtalo más tarde.';
        this.isLoading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadOrders(page);
    }
  }

  cancelOrder(orderId: string): void {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.isLoading = true;
      this.orderService.cancelOrder(orderId).subscribe({
        next: (updatedOrder) => {
          this.successMessage = `El pedido #${(updatedOrder.id || updatedOrder._id || '').slice(-6).toUpperCase()} ha sido cancelado con éxito.`;
          this.loadOrders(this.currentPage);
          
          setTimeout(() => {
            this.successMessage = '';
          }, 4000);
        },
        error: (err) => {
          console.error('Error cancelando orden:', err);
          this.errorMessage = err || 'No se pudo cancelar el pedido. Comunícate con soporte.';
          this.isLoading = false;
          
          setTimeout(() => {
            this.errorMessage = '';
          }, 4000);
        }
      });
    }
  }

  // Comprobar si se puede cancelar (solo en 'pending' o 'processing')
  canCancel(status: string): boolean {
    return ['pending', 'processing'].includes(status);
  }

  // Dar formato visual al estado de la orden
  formatStatus(status: string): { label: string; class: string } {
    const statusMap: { [key: string]: { label: string; class: string } } = {
      'pending': { label: 'Pendiente', class: 'status-pending' },
      'processing': { label: 'Procesando', class: 'status-processing' },
      'shipped': { label: 'Enviado', class: 'status-shipped' },
      'delivered': { label: 'Entregado', class: 'status-delivered' },
      'cancelled': { label: 'Cancelado', class: 'status-cancelled' }
    };
    return statusMap[status] || { label: status, class: 'status-unknown' };
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
