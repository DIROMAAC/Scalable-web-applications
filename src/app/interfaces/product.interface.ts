export interface ProductBase {
    id: string;
    _id?: string; // Para compatibilidad con MongoDB
    name: string;
    price: number;
    salePrice?: number;
    description: string;
    images: string[];
    rating: number;
    reviewCount: number;
    inStock: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    productType?: 'clothing' | 'accessory';
    category?: string;
}

export interface ClothingProduct extends ProductBase {
    productType: 'clothing';
    gender: 'men' | 'women';
    sizes: string[];
    fit: string;
}

export interface AccessoryProduct extends ProductBase {
    productType: 'accessory';
    dimensions?: string;
    adjustable?: boolean;
}

export type Product = ClothingProduct | AccessoryProduct;

// ✅ IMPROVED: CartItem más consistente y robusto
export interface CartItem {
  id: string;                    
  product: Product | string;     
  quantity: number;
  selectedSize?: string;
  unitPrice: number;           
  addedAt?: Date;              
}
export interface LegacyCartItem {
  product: Product | string;
  quantity: number;
  selectedSize?: string;
  unitPrice?: number;
}
// ✅ ALTERNATIVE: Si necesitas manejar casos donde solo tienes el ID
export interface CartItemWithId {
    productId: string;
    quantity: number;
    selectedSize?: string;
    // Campos adicionales para cuando no tienes el producto completo
    cachedName?: string;
    cachedPrice?: number;
    cachedImageUrl?: string;
}

// ✅ IMPROVED: Union type para manejar ambos casos
export type CartItemUnion = CartItem | CartItemWithId;

// Helper type guards
export function isCartItemWithProduct(item: CartItemUnion): item is CartItem {
    return typeof (item as CartItem).product === 'object';
}

export function isCartItemWithId(item: CartItemUnion): item is CartItemWithId {
    return typeof (item as CartItemWithId).productId === 'string';
}

// User interfaces
export interface UserAddress {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export interface PaymentMethod {
    id: number;
    type: 'credit' | 'debit' | 'paypal' | 'apple_pay'; // ✅ Más específico
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    cardholderName?: string;
    isDefault: boolean;
}

export interface User {
    id?: string; // ✅ Agregado ID de usuario
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Order interfaces
export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    selectedSize?: string; // ✅ Agregado para consistencia
}

export interface Order {
    id: string;
    userId: string; // ✅ Relación con usuario
    date: Date;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // ✅ Más específico
    items: OrderItem[];
    
    // Breakdown de precios
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    
    shippingAddress: UserAddress; // ✅ Usar interface en lugar de string
    paymentMethod?: PaymentMethod; // ✅ Información de pago
    trackingNumber?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

// Checkout interfaces
export interface CheckoutPaymentOption {
    id: string;
    name: string;
    type: PaymentMethod['type']; // ✅ Consistencia con PaymentMethod
    fee?: number; // ✅ Posible comisión
}

export interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    estimatedDays: string;
    description?: string; // ✅ Descripción adicional
}

// ✅ NEW: Interface para totales del carrito
export interface CartTotals {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    itemCount: number;
}

// ✅ NEW: Interface para filtros de productos
export interface ProductFilters {
    category?: string;
    gender?: 'men' | 'women';
    priceRange?: {
        min: number;
        max: number;
    };
    sizes?: string[];
    inStock?: boolean;
    onSale?: boolean;
}

// ✅ NEW: Interface para respuestas de API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

// ✅ NEW: Interface para paginación
export interface PaginatedResponse<T> {
    items: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
}