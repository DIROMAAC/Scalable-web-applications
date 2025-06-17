import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent implements OnInit {
  orderId: string = '';
  orderNumber: string = '';
  currentDate: Date = new Date();
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la orden desde la URL
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.orderNumber = `ORD-${this.orderId}`;
    
    console.log(' Página de confirmación cargada para orden:', this.orderId);
    
    // Simular carga de datos
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }
}