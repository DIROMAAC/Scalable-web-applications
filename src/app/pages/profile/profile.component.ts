import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { User, UserAddress, PaymentMethod } from '../../interfaces/product.interface';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // DATOS DEL USUARIO - EMPEZAR COMPLETAMENTE VACÍO
  user: User = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: ''
  };
  
  // Contraseñas para cambio
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // DIRECCIONES Y MÉTODOS DE PAGO - VACÍOS INICIALMENTE
  addresses: UserAddress[] = [];
  paymentMethods: PaymentMethod[] = [];
  
  // Estado de la edición
  editingPersonalInfo: boolean = false;
  editingAddress: UserAddress | null = null;
  addingNewAddress: boolean = false;
  changePasswordMode: boolean = false;
  
  // Nueva dirección temporal para formularios
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
  
  // Gestión de pestañas
  activeTab: 'info' | 'addresses' | 'payments' | 'preferences' = 'info';
  
  // Mensajes de estado
  successMessage: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    console.log(' ===== INICIALIZANDO PROFILE COMPONENT =====');
    this.loadUserData();
  }

  // CARGAR DATOS REALES DEL USUARIO
  loadUserData(): void {
    console.log(' Cargando datos del usuario autenticado...');
    
    // Verificar si hay usuario autenticado
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.warn('No hay usuario autenticado');
      this.router.navigate(['/login']);
      return;
    }

    console.log('Usuario autenticado encontrado:', currentUser);

    // USAR SOLO LOS DATOS REALES DEL TOKEN - NO AGREGAR DATOS FICTICIOS
    this.user = {
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      phone: '', // Dejar vacío hasta cargar del servidor
      birthDate: '' // Dejar vacío hasta cargar del servidor
    };

    console.log('Datos básicos cargados del token:', this.user);

    // Intentar cargar datos adicionales del servidor
    this.loadServerProfile();
  }

  // CARGAR DATOS DEL SERVIDOR SIN DEFAULTS FICTICIOS
  loadServerProfile(): void {
    this.loading = true;
    console.log('Intentando cargar perfil completo del servidor...');
    
    this.userService.loadUserProfile().subscribe({
      next: (serverProfile) => {
        console.log('Perfil del servidor recibido:', serverProfile);
        
        if (serverProfile) {
          // ACTUALIZAR SOLO SI HAY DATOS REALES DEL SERVIDOR
          this.user = {
            firstName: serverProfile.firstName || this.user.firstName,
            lastName: serverProfile.lastName || this.user.lastName,
            email: serverProfile.email || this.user.email,
            phone: serverProfile.phone || '', // Si está vacío en servidor, mantener vacío
            birthDate: serverProfile.birthDate || '' // Si está vacío en servidor, mantener vacío
          };
          
          console.log('Datos actualizados desde servidor:', this.user);
        } else {
          console.log('ℹNo hay perfil adicional en servidor, usando datos del token');
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.warn('No se pudo cargar perfil del servidor (normal si no existe):', error);
        console.log('ℹUsando solo datos del token de autenticación');
        this.loading = false;
      }
    });

    // Cargar direcciones del servidor
    this.userService.addresses$.subscribe(addresses => {
      console.log('Direcciones recibidas del servidor:', addresses);
      this.addresses = addresses.map(addr => ({
        id: addr.id ? (typeof addr.id === 'string' ? parseInt(addr.id) : addr.id) : Date.now(),
        name: addr.name,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
        isDefault: addr.isDefault
      }));
    });

    // Cargar métodos de pago del servidor
    this.userService.paymentMethods$.subscribe(methods => {
      console.log(' Métodos de pago del servidor:', methods);
      this.paymentMethods = methods.map(method => ({
        id: method.id ? (typeof method.id === 'string' ? parseInt(method.id) : method.id) : Date.now(),
        type: method.type,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault
      }));
    });
  }
  
  // Métodos para gestión de información personal
  toggleEditPersonalInfo(): void {
    this.editingPersonalInfo = !this.editingPersonalInfo;
    this.clearMessages();
  }
  
  // GUARDAR INFORMACIÓN PERSONAL REAL EN SERVIDOR
  savePersonalInfo(): void {
    console.log('===== GUARDANDO INFORMACIÓN PERSONAL =====');
    console.log('Datos a guardar:', this.user);
    
    // Validar que hay datos para guardar
    if (!this.user.firstName || !this.user.lastName) {
      this.errorMessage = 'Nombre y apellido son requeridos';
      return;
    }
    
    // Crear objeto con estructura que espera el UserService
    const profileData = {
      firstName: this.user.firstName.trim(),
      lastName: this.user.lastName.trim(),
      email: this.user.email.trim(),
      phone: this.user.phone.trim(),
      birthDate: this.user.birthDate || '',
      preferences: {
        emailMarketing: true,
        orderUpdates: true,
        newArrivals: false,
        newsletter: false
      }
    };
    
    console.log('Enviando al servidor:', profileData);
    
    this.userService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor al guardar perfil:', response);
        this.editingPersonalInfo = false;
        this.successMessage = 'Información personal actualizada correctamente';
      
        // RECARGAR DATOS PARA VERIFICAR QUE SE GUARDARON
        setTimeout(() => {
          this.loadServerProfile();
        }, 1000);
      },
      error: (error) => {
        console.error(' Error guardando perfil:', error);
        this.errorMessage = 'Error al actualizar la información: ' + error;
      }
    });
  }
  
  // Métodos para gestión de contraseña
  toggleChangePassword(): void {
    this.changePasswordMode = !this.changePasswordMode;
    this.clearMessages();
    
    if (!this.changePasswordMode) {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }
  
  saveNewPassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    
    if (this.passwordData.newPassword.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    
    console.log('Cambiando contraseña...');
    
    this.authService.changePassword(
      this.passwordData.currentPassword, 
      this.passwordData.newPassword
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.successMessage = 'Contraseña actualizada correctamente';
          this.changePasswordMode = false;
          this.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        } else {
          this.errorMessage = response.msg || 'Error al cambiar contraseña';
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al cambiar contraseña: ' + error;
      }
    });
  }
  
  // Métodos para gestión de direcciones
  editAddress(address: UserAddress): void {
    this.editingAddress = {...address};
    this.addingNewAddress = false;
    this.clearMessages();
  }
  
  cancelEditAddress(): void {
    this.editingAddress = null;
  }
  
  saveAddress(): void {
    if (!this.editingAddress) return;
    
    const addressToSave = {
      name: this.editingAddress.name,
      address: this.editingAddress.address,
      city: this.editingAddress.city,
      state: this.editingAddress.state,
      zipCode: this.editingAddress.zipCode,
      country: this.editingAddress.country,
      isDefault: this.editingAddress.isDefault
    };
    
    this.userService.updateAddress(this.editingAddress.id.toString(), addressToSave).subscribe({
      next: () => {
        this.successMessage = 'Dirección actualizada correctamente';
        this.editingAddress = null;
      },
      error: (error) => {
        this.errorMessage = 'Error al actualizar dirección: ' + error;
      }
    });
  }
  
  startAddNewAddress(): void {
    this.addingNewAddress = true;
    this.editingAddress = null;
    this.newAddress = {
      id: Date.now(),
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'España',
      isDefault: false
    };
    this.clearMessages();
  }
  
  saveNewAddress(): void {
    if (!this.newAddress.name || !this.newAddress.address || 
        !this.newAddress.city || !this.newAddress.zipCode) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }
    
    const addressToAdd = {
      name: this.newAddress.name,
      address: this.newAddress.address,
      city: this.newAddress.city,
      state: this.newAddress.state,
      zipCode: this.newAddress.zipCode,
      country: this.newAddress.country,
      isDefault: this.newAddress.isDefault
    };
    
    this.userService.addAddress(addressToAdd).subscribe({
      next: () => {
        this.successMessage = 'Nueva dirección añadida correctamente';
        this.addingNewAddress = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al añadir dirección: ' + error;
      }
    });
  }
  
  cancelNewAddress(): void {
    this.addingNewAddress = false;
  }
  
  deleteAddress(id: number): void {
    const address = this.addresses.find(addr => addr.id === id);
    if (address?.isDefault) {
      this.errorMessage = 'No puedes eliminar la dirección predeterminada';
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      this.userService.deleteAddress(id.toString()).subscribe({
        next: () => {
          this.successMessage = 'Dirección eliminada correctamente';
        },
        error: (error) => {
          this.errorMessage = 'Error al eliminar dirección: ' + error;
        }
      });
    }
  }
  
  setDefaultAddress(id: number): void {
    this.addresses.forEach(addr => {
      addr.isDefault = (addr.id === id);
    });
    
    const address = this.addresses.find(addr => addr.id === id);
    if (address) {
      address.isDefault = true;
      this.saveAddress();
    }
  }
  
  // Métodos para métodos de pago
  setDefaultPayment(id: number): void {
    this.paymentMethods.forEach(payment => {
      payment.isDefault = (payment.id === id);
    });
    this.successMessage = 'Método de pago predeterminado actualizado';
  }
  
  deletePaymentMethod(id: number): void {
    const method = this.paymentMethods.find(payment => payment.id === id);
    if (method?.isDefault) {
      this.errorMessage = 'No puedes eliminar el método de pago predeterminado';
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      this.userService.deletePaymentMethod(id.toString()).subscribe({
        next: () => {
          this.successMessage = 'Método de pago eliminado correctamente';
        },
        error: (error) => {
          this.errorMessage = 'Error al eliminar método de pago: ' + error;
        }
      });
    }
  }
  
  // Navegación entre pestañas
  setActiveTab(tab: 'info' | 'addresses' | 'payments' | 'preferences'): void {
    this.activeTab = tab;
    this.clearMessages();
    this.editingPersonalInfo = false;
    this.editingAddress = null;
    this.addingNewAddress = false;
    this.changePasswordMode = false;
  }
  
  // Utilidades
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  // MÉTODO PARA CERRAR SESIÓN
  logout(): void {
    console.log(' Cerrando sesión desde perfil...');
    
    // Confirmar antes de cerrar sesión
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      // El AuthService se encarga de la redirección
    }
  }
  
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  // GETTERS PÚBLICOS PARA EL TEMPLATE
  get currentUser() {
    return this.authService.currentUser;
  }
  
  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }

  get hasUserData(): boolean {
    return !!(this.user.firstName || this.user.lastName || this.user.email);
  }

  refreshUserData(): void {
    this.loadUserData();
  }
}