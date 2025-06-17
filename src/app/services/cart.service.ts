import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, CartItem, CartTotals } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private cartTotalsSubject = new BehaviorSubject<CartTotals>({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  });

  public cartItems$ = this.cartItemsSubject.asObservable();
  public cartTotals$ = this.cartTotalsSubject.asObservable();

  constructor() {
    console.log(' CartService inicializado');
    this.calculateTotals();
  }

  //  Agregar producto al carrito
  addToCart(product: Product, quantity: number = 1, selectedSize?: string): void {
    console.log(' Agregando al carrito:', product.name, { quantity, selectedSize });

    // Validar talla para productos de ropa
    if (product.productType === 'clothing' && !selectedSize) {
      throw new Error('Debe seleccionar una talla para productos de ropa');
    }

    // Buscar si el producto ya existe en el carrito
    const existingItemIndex = this.cartItems.findIndex(item => 
      item.id === product.id && item.selectedSize === selectedSize
    );

    if (existingItemIndex >= 0) {
      // Si existe, actualizar cantidad
      this.cartItems[existingItemIndex].quantity += quantity;
      console.log(' Cantidad actualizada para:', product.name);
    } else {
      // Si no existe, crear nuevo item
      const newItem: CartItem = {
        id: `${product.id}_${selectedSize || 'no-size'}_${Date.now()}`,
        product: product,
        quantity: quantity,
        selectedSize: selectedSize,
        unitPrice: product.salePrice || product.price,
        addedAt: new Date()
      };
      
      this.cartItems.push(newItem);
      console.log(' Producto añadido al carrito:', product.name);
    }

    this.updateCart();
  }

  //  Actualizar cantidad de un item
  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      this.cartItems[itemIndex].quantity = newQuantity;
      console.log(' Cantidad actualizada:', newQuantity);
      this.updateCart();
    }
  }

  //  Remover producto del carrito
  removeFromCart(itemId: string): void {
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    
    if (this.cartItems.length < initialLength) {
      console.log(' Producto removido del carrito');
      this.updateCart();
    }
  }

  //  Limpiar todo el carrito
  clearCart(): void {
    this.cartItems = [];
    console.log(' Carrito limpiado');
    this.updateCart();
  }

  //  Obtener items del carrito
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  //  Obtener cantidad total de items
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  //  Verificar si el carrito está vacío
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  //  Obtener producto por ID en el carrito
  getCartItem(itemId: string): CartItem | undefined {
    return this.cartItems.find(item => item.id === itemId);
  }

  //  Verificar si un producto está en el carrito
  isInCart(productId: string, selectedSize?: string): boolean {
    return this.cartItems.some(item => {
      if (typeof item.product === 'string') {
        return item.product === productId;
      }
      return item.product.id === productId && 
             (!selectedSize || item.selectedSize === selectedSize);
    });
  }

  //  Obtener subtotal
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);
  }

  //  Calcular envío
  private calculateShipping(subtotal: number): number {
    // Envío gratuito para pedidos >= 100€
    return subtotal >= 100 ? 0 : 5.99;
  }

  //  Calcular impuestos (IVA 21% en España)
  private calculateTax(subtotal: number): number {
    return subtotal * 0.21;
  }

  //  Calcular totales
  private calculateTotals(): void {
    const subtotal = this.getSubtotal();
    const shipping = this.calculateShipping(subtotal);
    const tax = this.calculateTax(subtotal);
    const total = subtotal + shipping + tax;
    const itemCount = this.getTotalItems();

    const totals: CartTotals = {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount
    };

    this.cartTotalsSubject.next(totals);
  }

  //  Actualizar carrito y notificar cambios
  private updateCart(): void {
    this.cartItemsSubject.next([...this.cartItems]);
    this.calculateTotals();
    
    console.log('🛒 Estado del carrito actualizado:', {
      items: this.cartItems.length,
      totalItems: this.getTotalItems(),
      subtotal: this.getSubtotal()
    });
  }

  //  Preparar datos para checkout
  prepareCheckoutData(): any {
    return this.cartItems.map(item => ({
      productId: typeof item.product === 'string' ? item.product : item.product.id,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      unitPrice: item.unitPrice
    }));
  }

  //  Validar carrito antes del checkout
  validateCart(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.isEmpty()) {
      errors.push('El carrito está vacío');
    }

    // Validar que todos los productos tengan stock
    for (const item of this.cartItems) {
      if (typeof item.product !== 'string') {
        if (!item.product.inStock) {
          errors.push(`${item.product.name} no está disponible`);
        }
        
        // Validar tallas para ropa
        if (item.product.productType === 'clothing' && !item.selectedSize) {
          errors.push(`Debe seleccionar una talla para ${item.product.name}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  //  Debug: Imprimir estado del carrito
  debugCart(): void {
    console.log(' ESTADO DEL CARRITO:', {
      items: this.cartItems,
      totals: this.cartTotalsSubject.value,
      isEmpty: this.isEmpty(),
      totalItems: this.getTotalItems()
    });
  }
}