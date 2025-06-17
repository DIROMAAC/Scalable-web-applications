import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartService } from '../../services/cart.service';
import { OrderService, CreateOrderRequest } from '../../services/order.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CartItem, CartTotals, UserAddress, ShippingMethod, CheckoutPaymentOption, Product } from '../../interfaces/product.interface';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  // Datos del carrito
  cartItems: CartItem[] = [];
  cartTotals: CartTotals = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  };

  // Pasos del checkout
  currentStep: 'shipping' | 'payment' | 'review' = 'shipping';
  
  // Direcciones del usuario
  userAddresses: UserAddress[] = [];
  selectedAddressId: number | null = null;
  
  // Nueva dirección
  newAddress: UserAddress = {
    id: 0,
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'España',
    isDefault: false
  };
  isAddingNewAddress = false;

  // Métodos de envío
  shippingMethods: ShippingMethod[] = [];
  selectedShippingMethod = 'standard';

  // Información de pago
  paymentOptions: CheckoutPaymentOption[] = [];
  selectedPaymentMethod = 'credit_card';
  paymentData = {
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  };

  // Estados del componente
  isLoading = false;
  isProcessingOrder = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log(' Inicializando CheckoutComponent...');
    
    // Verificar autenticación
    if (!this.authService.isAuthenticated) {
      console.log(' Usuario no autenticado, redirigiendo...');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
      return;
    }

    // Verificar que hay productos en el carrito
    if (this.cartService.isEmpty()) {
      console.log(' Carrito vacío, redirigiendo...');
      this.router.navigate(['/cart']);
      return;
    }

    console.log(' Verificaciones pasadas, cargando datos...');
    
    //  AGREGAR TIMEOUT PARA DEBUG
    setTimeout(() => {
      this.debugCompleteAddressFlow();
    }, 1000);
    
    this.loadCheckoutData();
  }

  private loadCheckoutData(): void {
    console.log(' Iniciando carga de datos del checkout...');
    
    // Cargar datos del carrito
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      console.log(' Items del carrito cargados:', items.length);
    });

    this.cartService.cartTotals$.subscribe(totals => {
      this.cartTotals = totals;
      console.log(' Totales del carrito cargados:', totals);
    });

    // Cargar opciones de envío y pago
    this.shippingMethods = this.orderService.shippingMethods;
    this.paymentOptions = this.orderService.paymentOptions;
    console.log(' Métodos de envío y pago cargados');

    //  CARGAR DIRECCIONES CORRECTAMENTE
    this.loadUserAddresses();
  }

  //  NUEVO MÉTODO PARA FORZAR CARGA DE PERFIL
  private forceLoadUserProfile(): void {
    console.log(' Forzando carga del perfil de usuario...');
    
    this.userService.loadUserProfile().subscribe({
      next: (profile) => {
        console.log(' Perfil cargado:', profile);
        // El perfil debería disparar la carga de direcciones
      },
      error: (error) => {
        console.error(' Error cargando perfil:', error);
      }
    });
  }
  forceSelectFirstAddress(): void {
    console.log(' === FORZANDO SELECCIÓN MANUAL ===');
    
    if (this.userAddresses.length === 0) {
      console.log(' No hay direcciones para seleccionar');
      return;
    }
    
    const firstAddress = this.userAddresses[0];
    this.selectedAddressId = firstAddress.id;
    this.isAddingNewAddress = false;
    this.errorMessage = '';
    
    console.log(' Dirección seleccionada manualmente:', {
      id: this.selectedAddressId,
      name: firstAddress.name
    });
    
    // Verificar inmediatamente
    setTimeout(() => {
      const isValid = this.validateShippingStep();
      console.log(' Validación después de selección manual:', isValid);
    }, 100);
  }
  
  public loadUserAddresses(): void {
    console.log(' === CARGA DE DIRECCIONES CON FALLBACK ===');
    
    // Primero intentar cargar desde la API
    this.userService.loadUserProfile().subscribe({
      next: (profile) => {
        console.log(' Perfil cargado exitosamente');
        // Si llegamos aquí, la API funciona
      },
      error: (error) => {
        console.error(' Error de conexión con backend:', error);
        
        // Si es error de conexión, usar datos mock
        if (error.status === 0 || error.name === 'HttpErrorResponse') {
          console.log(' Backend no disponible, usando datos mock...');
          this.initializeMockData();
        }
      }
    });
    
    // Suscribirse a cambios en addresses$
    this.userService.addresses$.subscribe({
      next: (addresses: UserAddress[]) => {
        if (addresses.length > 0) {
          console.log(' Direcciones recibidas:', addresses);
          this.handleAddressesUpdate(addresses);
        }
      },
      error: (error) => {
        console.error(' Error en addresses$ subscription:', error);
      }
    });
  }

  //implementacion de funcion de arriba
  private loadProfileWithRetry(maxRetries: number): void {
    console.log(` Intentando cargar perfil (intentos restantes: ${maxRetries})`);
    
    this.userService.loadUserProfile().subscribe({
      next: (profile) => {
        console.log(' Perfil cargado exitosamente:', profile);
        
        // Si no hay direcciones después de 2 segundos, reintentar
        setTimeout(() => {
          if (this.userAddresses.length === 0 && maxRetries > 0) {
            console.log(' No hay direcciones, reintentando...');
            this.loadProfileWithRetry(maxRetries - 1);
          }
        }, 2000);
      },
      error: (error) => {
        console.error(' Error cargando perfil:', error);
        
        if (maxRetries > 0) {
          console.log(` Reintentando en 1 segundo... (${maxRetries - 1} intentos restantes)`);
          setTimeout(() => {
            this.loadProfileWithRetry(maxRetries - 1);
          }, 1000);
        }
      }
    });
  }

  private handleAddressesUpdate(addresses: UserAddress[]): void {
    console.log(' === PROCESANDO ACTUALIZACIÓN DE DIRECCIONES ===');
    console.log('- Direcciones recibidas:', addresses);
    console.log('- Estado previo selectedAddressId:', this.selectedAddressId);
    console.log('- Estado previo isAddingNewAddress:', this.isAddingNewAddress);
    
    this.userAddresses = addresses;
    
    if (!addresses || addresses.length === 0) {
      console.log(' No hay direcciones disponibles');
      this.selectedAddressId = null;
      return;
    }
    
    console.log(' Direcciones cargadas exitosamente:', addresses.length);
    addresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. ID: ${addr.id}, Nombre: ${addr.name}, Default: ${addr.isDefault}`);
    });
    
    //  FORZAR SELECCIÓN AUTOMÁTICA SIEMPRE
    if (!this.isAddingNewAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      const addressToSelect = defaultAddress || addresses[0];
      
      //  ASIGNACIÓN DIRECTA Y FORZADA
      this.selectedAddressId = addressToSelect.id;
      
      console.log(' DIRECCIÓN SELECCIONADA AUTOMÁTICAMENTE:', {
        id: this.selectedAddressId,
        name: addressToSelect.name,
        isDefault: addressToSelect.isDefault
      });
      
      //  LIMPIAR ERRORES
      this.errorMessage = '';
      
      //  VERIFICACIÓN INMEDIATA
      setTimeout(() => {
        console.log(' Verificación post-selección:');
        console.log('- selectedAddressId después:', this.selectedAddressId);
        console.log('- errorMessage después:', this.errorMessage);
      }, 100);
    }
  }

  private handleAddressesLoaded(addresses: UserAddress[]): void {
    console.log(' Procesando direcciones cargadas:', addresses);
    
    if (!addresses || addresses.length === 0) {
      console.log(' No hay direcciones disponibles');
      this.userAddresses = [];
      this.selectedAddressId = null;
      return;
    }
    
    this.userAddresses = addresses;
    console.log(' Direcciones asignadas al componente:', this.userAddresses.length);
    
    // Auto-seleccionar dirección si no hay ninguna seleccionada
    if (this.selectedAddressId === null && !this.isAddingNewAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      const addressToSelect = defaultAddress || addresses[0];
      
      this.selectedAddressId = addressToSelect.id;
      console.log(' Dirección auto-seleccionada:', {
        id: this.selectedAddressId,
        name: addressToSelect.name,
        esDefault: addressToSelect.isDefault
      });
    }
    
    // Limpiar errores si había
    if (this.errorMessage === 'Debe seleccionar una dirección de envío') {
      this.errorMessage = '';
    }
  }

  private handleAddressError(): void {
    console.error(' No se pudieron cargar las direcciones del usuario');
    this.userAddresses = [];
    this.selectedAddressId = null;
  }

  //  Navegación entre pasos
  goToStep(step: 'shipping' | 'payment' | 'review'): void {
    // Debug: mostrar estado actual
    console.log(' Estado actual del checkout:', {
      selectedAddressId: this.selectedAddressId,
      isAddingNewAddress: this.isAddingNewAddress,
      userAddresses: this.userAddresses.length,
      currentStep: this.currentStep
    });

    if (step === 'payment' && !this.validateShippingStep()) {
      console.log(' Validación de envío falló');
      return;
    }
    
    if (step === 'review' && !this.validatePaymentStep()) {
      console.log(' Validación de pago falló');
      return;
    }

    this.currentStep = step;
    this.errorMessage = '';
    console.log(' Paso cambiado a:', step);
  }

  nextStep(): void {
    switch (this.currentStep) {
      case 'shipping':
        this.goToStep('payment');
        break;
      case 'payment':
        this.goToStep('review');
        break;
      case 'review':
        this.submitOrder();
        break;
    }
  }

  previousStep(): void {
    switch (this.currentStep) {
      case 'payment':
        this.goToStep('shipping');
        break;
      case 'review':
        this.goToStep('payment');
        break;
    }
  }

  //  Validaciones
  private validateShippingStep(): boolean {
    console.log(' === VALIDACIÓN DE ENVÍO ===');
    console.log('Estado actual:', {
      isAddingNewAddress: this.isAddingNewAddress,
      selectedAddressId: this.selectedAddressId,
      userAddressesCount: this.userAddresses.length,
      errorMessage: this.errorMessage
    });

    // Si está añadiendo nueva dirección
    if (this.isAddingNewAddress) {
      console.log(' Validando nueva dirección...');
      if (!this.newAddress.name?.trim() || !this.newAddress.address?.trim() || 
          !this.newAddress.city?.trim() || !this.newAddress.zipCode?.trim()) {
        this.errorMessage = 'Complete todos los campos de la dirección';
        console.log(' Nueva dirección incompleta');
        return false;
      }
      console.log(' Nueva dirección válida');
      return true;
    }

    // Verificar que hay direcciones disponibles
    if (this.userAddresses.length === 0) {
      this.errorMessage = 'No hay direcciones disponibles. Agregue una nueva dirección.';
      console.log(' No hay direcciones disponibles');
      return false;
    }

    // Verificar selección
    if (this.selectedAddressId === null || this.selectedAddressId === undefined) {
      this.errorMessage = 'Debe seleccionar una dirección de envío';
      console.log(' No hay dirección seleccionada');
      return false;
    }

    // Verificar que la dirección existe
    const selectedAddress = this.userAddresses.find(addr => addr.id === this.selectedAddressId);
    if (!selectedAddress) {
      this.errorMessage = 'La dirección seleccionada no es válida';
      console.log(' Dirección seleccionada no encontrada');
      return false;
    }

    console.log(' Validación exitosa:', selectedAddress.name);
    return true;
  }

  //  Gestión de direcciones
  selectAddress(addressId: number): void {
    console.log(' === SELECCIONANDO DIRECCIÓN ===');
    console.log('- ID recibido:', addressId, typeof addressId);
    console.log('- Direcciones disponibles:', this.userAddresses.map(a => a.id));
    
    // Verificar que la dirección existe
    const addressExists = this.userAddresses.find(addr => addr.id === addressId);
    if (!addressExists) {
      console.error(' Dirección no encontrada:', addressId);
      this.errorMessage = 'Dirección no válida';
      return;
    }
    
    // Limpiar estado anterior
    this.isAddingNewAddress = false;
    this.selectedAddressId = addressId;
    this.errorMessage = '';
    
    console.log(' Dirección seleccionada exitosamente:', {
      id: this.selectedAddressId,
      name: addressExists.name
    });
  }

  toggleNewAddress(): void {
    console.log(' Toggle nueva dirección. Estado actual:', this.isAddingNewAddress);
    
    if (!this.isAddingNewAddress) {
      //  ACTIVAR MODO NUEVA DIRECCIÓN
      this.selectedAddressId = null;
      this.isAddingNewAddress = true;
      console.log(' Modo nueva dirección activado');
    } else {
      //  CANCELAR NUEVA DIRECCIÓN
      this.isAddingNewAddress = false;
      this.newAddress = {
        id: 0,
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'España',
        isDefault: false
      };
      
      // Seleccionar primera dirección disponible
      if (this.userAddresses.length > 0) {
        const defaultAddr = this.userAddresses.find(addr => addr.isDefault) || this.userAddresses[0];
        this.selectedAddressId = defaultAddr.id;
        console.log(' Volviendo a dirección existente:', defaultAddr.id);
      }
    }
    
    this.errorMessage = '';
  }

  saveNewAddress(): void {
    if (!this.newAddress.name || !this.newAddress.address || 
        !this.newAddress.city || !this.newAddress.zipCode) {
      this.errorMessage = 'Complete todos los campos requeridos';
      return;
    }

    console.log(' Guardando nueva dirección:', this.newAddress);

    this.userService.addAddress(this.newAddress).subscribe({
      next: (response) => {
        console.log(' Dirección guardada exitosamente:', response);
        this.successMessage = 'Dirección añadida correctamente';
        
        //  EL BEHAVIORSUBJECT SE ACTUALIZARÁ AUTOMÁTICAMENTE
        // Solo necesitamos cambiar el modo
        this.isAddingNewAddress = false;
        
        // Limpiar formulario
        this.newAddress = {
          id: 0,
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'España',
          isDefault: false
        };
        
        // La nueva dirección se seleccionará automáticamente cuando llegue la actualización
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error guardando dirección:', error);
        this.errorMessage = error;
      }
    });
  }

  //  Cálculo de costos
  calculateShippingCost(): number {
    try {
      return this.orderService.calculateShippingCost(this.cartTotals.subtotal, this.selectedShippingMethod);
    } catch (error) {
      console.error(' Error calculando costo de envío:', error);
      return 0;
    }
  }

  getSelectedShippingMethod(): ShippingMethod | null {
    try {
      return this.orderService.getShippingMethod(this.selectedShippingMethod);
    } catch (error) {
      console.error('❌ Error obteniendo método de envío:', error);
      return null;
    }
  }

  //  Envío de la orden
// 1. Método validatePaymentStep() que falta:
  private validatePaymentStep(): boolean {
    console.log(' Validando paso de pago...');
    
    if (!this.selectedPaymentMethod) {
      this.errorMessage = 'Debe seleccionar un método de pago';
      console.log(' No hay método de pago seleccionado');
      return false;
    }

    if (this.selectedPaymentMethod === 'credit_card' || this.selectedPaymentMethod === 'debit_card') {
      if (!this.paymentData.cardNumber || !this.paymentData.expiryMonth || 
          !this.paymentData.expiryYear || !this.paymentData.cvv || 
          !this.paymentData.cardholderName) {
        this.errorMessage = 'Complete todos los campos de la tarjeta';
        console.log(' Datos de tarjeta incompletos');
        return false;
      }
    }

    console.log(' Validación de pago exitosa');
    return true;
  }


  submitOrder(): void {
    console.log(' Iniciando envío de orden...');
    
    if (!this.validateShippingStep() || !this.validatePaymentStep()) {
      console.log(' Validación falló, no se puede enviar la orden');
      return;
    }

    this.isProcessingOrder = true;
    this.errorMessage = '';

    // Preparar dirección de envío
    let shippingAddress: UserAddress;
    
    if (this.isAddingNewAddress) {
      shippingAddress = this.newAddress;
      console.log(' Usando nueva dirección para envío');
    } else {
      const selectedAddr = this.userAddresses.find(addr => addr.id === this.selectedAddressId);
      if (!selectedAddr) {
        this.errorMessage = 'Dirección de envío no válida';
        this.isProcessingOrder = false;
        return;
      }
      shippingAddress = selectedAddr;
      console.log(' Usando dirección existente:', selectedAddr.name);
    }

    // Preparar información de pago
    const paymentInfo = {
      method: this.selectedPaymentMethod,
      last4: this.paymentData.cardNumber ? this.paymentData.cardNumber.slice(-4) : '',
      cardType: this.paymentData.cardNumber ? this.getCardType(this.paymentData.cardNumber) : '',
      transactionId: this.generateTransactionId()
    };

    // Preparar datos de la orden
    const orderData: CreateOrderRequest = {
      items: this.cartService.prepareCheckoutData(),
      shippingAddress,
      paymentInfo,
      shippingMethod: this.selectedShippingMethod
    };

    console.log(' Enviando orden:', orderData);

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        console.log(' Orden creada exitosamente:', order);
        
        // Limpiar carrito
        this.cartService.clearCart();
        
        // Redirigir a página de confirmación
        this.router.navigate(['/order-confirmation', order.id]);
      },
      error: (error) => {
        console.error(' Error creando orden:', error);
        this.errorMessage = error;
        this.isProcessingOrder = false;
      }
    });
  }

  //  Helpers
  private getCardType(cardNumber: string): string {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'Mastercard';
    if (num.startsWith('3')) return 'American Express';
    return 'Visa';
  }

  private generateTransactionId(): string {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getSelectedAddress(): UserAddress | null {
    if (this.isAddingNewAddress) {
      return this.newAddress;
    }
    return this.userAddresses.find(addr => addr.id === this.selectedAddressId) || null;
  }

  //  Getters para el template
  get canProceedToPayment(): boolean {
    return this.validateShippingStep();
  }

  get canProceedToReview(): boolean {
    return this.validateShippingStep() && this.validatePaymentStep();
  }

  get finalTotal(): number {
    const shipping = this.calculateShippingCost();
    const tax = this.cartTotals.subtotal * 0.21;
    return this.cartTotals.subtotal + shipping + tax;
  }

  //  Cancelar checkout
  cancelCheckout(): void {
    if (confirm('¿Estás seguro de que quieres cancelar la compra?')) {
      this.router.navigate(['/cart']);
    }
  }

  //  Helper methods para manejar CartItems
  getProductImage(item: CartItem): string {
    if (typeof item.product === 'string') {
      return 'https://via.placeholder.com/150x150?text=No+Image';
    }
    return item.product.images?.[0] || 'https://via.placeholder.com/150x150?text=No+Image';
  }

  getProductName(item: CartItem): string {
    if (typeof item.product === 'string') {
      return 'Producto no disponible';
    }
    return item.product.name || 'Producto sin nombre';
  }

  getProduct(item: CartItem): Product | null {
    return typeof item.product === 'string' ? null : item.product;
  }

debugCompleteAddressFlow(): void {
  console.log(' === DEBUG COMPLETO DE DIRECCIONES ===');
  
  console.log('1. Estado de autenticación:');
  console.log('- isAuthenticated:', this.authService.isAuthenticated);
  console.log('- authHeaders:', this.authService.getAuthHeaders());
  
  console.log('2. Estado del componente:');
  console.log('- userAddresses:', this.userAddresses);
  console.log('- selectedAddressId:', this.selectedAddressId);
  console.log('- isAddingNewAddress:', this.isAddingNewAddress);
  
  console.log('3. Estado del UserService:');
  this.userService.addresses$.subscribe(addresses => {
    console.log('- BehaviorSubject addresses$:', addresses);
  }).unsubscribe();
  
  console.log('4. Probando carga manual del perfil:');
  this.userService.loadUserProfile().subscribe({
    next: (profile) => {
      console.log('- Perfil cargado:', profile);
      console.log('- ¿Tiene direcciones?', profile?.addresses);
    },
    error: (error) => {
      console.error('- Error cargando perfil:', error);
    }
  });
  
  console.log('5. Verificando API directamente:');
  // Vamos a hacer una llamada directa a la API para ver qué pasa
  this.testDirectApiCall();
}
private testDirectApiCall(): void {
  const headers = this.authService.getAuthHeaders();
  const apiUrl = 'http://localhost:3000/api'; // Ajusta esto a tu URL real
  
  console.log(' Probando API directamente...');
  console.log('- URL:', `${apiUrl}/users/profile`);
  console.log('- Headers:', headers);
  
  this.http.get(`${apiUrl}/users/profile`, { headers }).subscribe({
    next: (response) => {
      console.log(' Respuesta directa de API:', response);
    },
    error: (error) => {
      console.error(' Error directo de API:', error);
      console.error('- Status:', error.status);
      console.error('- Error body:', error.error);
    }
  });
}
forceMockAddresses(): void {
  console.log(' Forzando direcciones mock para prueba...');
  
  const mockAddresses: UserAddress[] = [
    {
      id: 1,
      name: 'casa',
      address: 'tercera',
      city: 'slp',
      state: 'slp',
      zipCode: '12312',
      country: 'mexico',
      isDefault: true
    }
  ];
  
  // Actualizar el BehaviorSubject directamente
  (this.userService as any).addressesSubject.next(mockAddresses);
  
  console.log(' Direcciones mock agregadas');
  
  // Forzar actualización del componente
  this.handleAddressesUpdate(mockAddresses);
}
initializeMockData(): void {
  console.log(' === INICIALIZANDO DATOS MOCK ===');
  
  const mockAddresses: UserAddress[] = [
    {
      id: 1,
      name: 'casa',
      address: 'tercera',
      city: 'slp',
      state: 'slp', 
      zipCode: '12312',
      country: 'mexico',
      isDefault: true
    }
  ];
  
  console.log(' Direcciones mock creadas:', mockAddresses);
  
  //  ACTUALIZAR BEHAVIORSUBJECT
  (this.userService as any).addressesSubject.next(mockAddresses);
  
  //  ACTUALIZAR COMPONENTE DIRECTAMENTE
  this.userAddresses = mockAddresses;
  this.selectedAddressId = mockAddresses[0].id;
  this.isAddingNewAddress = false;
  this.errorMessage = '';
  
  console.log(' Estado después de mock:', {
    userAddresses: this.userAddresses.length,
    selectedAddressId: this.selectedAddressId,
    isAddingNewAddress: this.isAddingNewAddress,
    errorMessage: this.errorMessage
  });
  
  //  FORZAR ACTUALIZACIÓN DE LA VISTA
  this.forceViewUpdate();
}
private forceViewUpdate(): void {
  // Esto fuerza a Angular a verificar los cambios
  setTimeout(() => {
    console.log(' Forzando actualización de vista...');
    
    // Verificar que todo esté bien
    const isValid = this.validateShippingStep();
    console.log(' Validación después de mock:', isValid);
    
    if (!isValid) {
      console.log(' Aún hay problemas, debuggeando...');
      this.debugCurrentState();
    }
  }, 200);
}
debugCurrentState(): void {
  console.log(' === ESTADO ACTUAL COMPLETO ===');
  console.log('Component State:');
  console.log('- userAddresses:', this.userAddresses);
  console.log('- selectedAddressId:', this.selectedAddressId, typeof this.selectedAddressId);
  console.log('- isAddingNewAddress:', this.isAddingNewAddress);
  console.log('- errorMessage:', this.errorMessage);
  
  console.log('Validation Check:');
  const validationResult = this.validateShippingStep();
  console.log('- validateShippingStep():', validationResult);
  
  console.log('Address Details:');
  if (this.userAddresses.length > 0) {
    this.userAddresses.forEach(addr => {
      console.log(`  - Address ID ${addr.id}: ${addr.name} (selected: ${this.selectedAddressId === addr.id})`);
    });
  }
  
  // Verificar si existe la dirección seleccionada
  if (this.selectedAddressId) {
    const found = this.userAddresses.find(addr => addr.id === this.selectedAddressId);
    console.log('- Selected address exists:', !!found);
    if (found) {
      console.log('- Selected address details:', found);
    }
  }
}
checkBackendStatus(): void {
  const commonPorts = [3000, 3001, 5000, 8000, 4000];
  
  console.log(' Verificando puertos comunes del backend...');
  
  commonPorts.forEach(port => {
    const testUrl = `http://localhost:${port}/api/users/profile`;
    
    this.http.get(testUrl, { 
      headers: this.authService.getAuthHeaders()
    }).pipe(
      timeout(2000) // Agrega el timeout aquí usando el operador de RxJS
    ).subscribe({
      next: (response) => {
        console.log(` Backend encontrado en puerto ${port}:`, response);
      },
      error: (error) => {
        if (error.name === 'TimeoutError') {
          console.log(` Tiempo de espera agotado para el puerto ${port}`);
        } else {
          console.log(` Puerto ${port} no disponible`);
        }
      }
    });
  });
}
}