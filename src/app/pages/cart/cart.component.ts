import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CartItem, CartTotals, Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, HeaderComponent, FooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotals: CartTotals = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartData();
  }

  private loadCartData(): void {
    // Suscribirse a los cambios del carrito
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      console.log(' Items del carrito actualizados:', items.length);
    });

    // Suscribirse a los totales del carrito
    this.cartService.cartTotals$.subscribe(totals => {
      this.cartTotals = totals;
      console.log(' Totales del carrito actualizados:', totals);
    });
  }

  //  Actualizar cantidad de un producto
  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(itemId);
      return;
    }

    this.cartService.updateQuantity(itemId, newQuantity);
  }

  //  Incrementar cantidad
  incrementQuantity(itemId: string): void {
    const item = this.cartService.getCartItem(itemId);
    if (item) {
      this.updateQuantity(itemId, item.quantity + 1);
    }
  }

  //  Decrementar cantidad
  decrementQuantity(itemId: string): void {
    const item = this.cartService.getCartItem(itemId);
    if (item && item.quantity > 1) {
      this.updateQuantity(itemId, item.quantity - 1);
    }
  }

  //  Remover producto del carrito
  removeItem(itemId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
      this.cartService.removeFromCart(itemId);
    }
  }

  //  Limpiar todo el carrito
  clearCart(): void {
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
      this.cartService.clearCart();
    }
  }

  //  Proceder al checkout
  proceedToCheckout(): void {
    if (!this.authService.isAuthenticated) {
      // Redirigir al login si no está autenticado
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
      return;
    }

    if (this.cartService.isEmpty()) {
      this.errorMessage = 'El carrito está vacío';
      return;
    }

    // Validar carrito
    const validation = this.cartService.validateCart();
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join(', ');
      return;
    }

    this.router.navigate(['/checkout']);
  }

  //  Continuar comprando
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  //  Ver detalles del producto
  viewProductDetails(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  //  Getters para el template
  get isEmpty(): boolean {
    return this.cartService.isEmpty();
  }

  get totalItems(): number {
    return this.cartService.getTotalItems();
  }

  //  Helper para obtener producto del item
  getProduct(item: CartItem): Product | null {
    return typeof item.product === 'string' ? null : item.product;
  }

  //  Helper para obtener imagen del producto
  getProductImage(item: CartItem): string {
    const product = this.getProduct(item);
    return product?.images?.[0] || 'https://via.placeholder.com/150x150?text=No+Image';
  }

  //  Helper para obtener nombre del producto
  getProductName(item: CartItem): string {
    const product = this.getProduct(item);
    return product?.name || 'Producto no disponible';
  }

  //  Helper para calcular precio total del item
  getItemTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  //  Helper para verificar si hay envío gratuito
  get hasFreeShipping(): boolean {
    return this.cartTotals.subtotal >= 100;
  }

  //  Helper para calcular cuánto falta para envío gratuito
  get amountForFreeShipping(): number {
    return Math.max(0, 100 - this.cartTotals.subtotal);
  }
}