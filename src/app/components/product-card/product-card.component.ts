import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass, NgIf, CurrencyPipe, NgFor } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ NgIf, CurrencyPipe, MatCardModule, MatButtonModule, NgFor],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  @Output()
  onDetailsEvent = new EventEmitter<string>();
  
  @Output()
  onAddToCartEvent = new EventEmitter<string>();

  @Input({required: true})
  product: Product | null = null;

  isHovered: boolean = false;
  currentImageIndex: number = 0;

  onMouseEnter(): void {
    this.isHovered = true;
    if (this.product && this.product.images.length > 1) {
      this.currentImageIndex = 1;
    }
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.currentImageIndex = 0;
  }

  onDetails(): void {
    this.onDetailsEvent.emit(this.product!.id);
  }
  
  addToCart(event: Event): void {
    event.stopPropagation();
    if (!this.product) return;

    try {
      // Verificar si es producto de ropa y necesita talla
      if (this.product.productType === 'clothing') {
        // Para productos de ropa, redirigir a detalles para seleccionar talla
        console.log(' Producto de ropa - redirigiendo a detalles para seleccionar talla');
        this.onDetailsEvent.emit(this.product.id);
        return;
      } else {
        // Para accesorios, añadir directamente al carrito
        console.log('🛒 Añadiendo accesorio al carrito:', this.product.name);
        this.cartService.addToCart(this.product, 1);
        
        // Mostrar mensaje temporal
        this.showSuccessMessage();
      }
    } catch (error: any) {
      console.error(' Error añadiendo al carrito:', error);
      alert(error.message || 'Error al añadir el producto al carrito');
    }
  }

  private showSuccessMessage(): void {
    // Crear elemento de mensaje temporal
    const message = document.createElement('div');
    message.textContent = `${this.product!.name} añadido al carrito`;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d4edda;
      color: #155724;
      padding: 15px 20px;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(message);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  //  Verificar si está en el carrito
  get isInCart(): boolean {
    if (!this.product) return false;
    return this.cartService.isInCart(this.product.id);
  }

  // Ir al carrito
  goToCart(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/cart']);
  }

  // Ver detalles del producto
  viewDetails(event: Event): void {
    event.stopPropagation();
    this.onDetailsEvent.emit(this.product!.id);
  }
}