import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  firstName: string = '';
  lastName: string = '';
  agreeTerms: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  registerError: string = '';
  loading: boolean = false;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    console.log(' RegisterComponent inicializado');
    // Si el usuario ya está autenticado, redirigir al inicio
    if (this.authService.isAuthenticated) {
      console.log(' Usuario ya autenticado, redirigiendo...');
      this.router.navigate(['/']);
    }
  }
  
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    console.log('Cambiando visibilidad de:', field);
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
  
  onSubmit(): void {
    console.log(' ===== INICIANDO PROCESO DE REGISTRO =====');
    console.log('Datos del formulario:', {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      password: this.password ? '***' : 'VACÍO',
      confirmPassword: this.confirmPassword ? '***' : 'VACÍO',
      agreeTerms: this.agreeTerms
    });
    
    // VALIDACIÓN DETALLADA
    if (!this.firstName) {
      this.registerError = 'El nombre es requerido';
      console.error('Falta nombre');
      return;
    }
    
    if (!this.lastName) {
      this.registerError = 'El apellido es requerido';
      console.error('Falta apellido');
      return;
    }
    
    if (!this.email) {
      this.registerError = 'El email es requerido';
      console.error('Falta email');
      return;
    }
    
    if (!this.password) {
      this.registerError = 'La contraseña es requerida';
      console.error('Falta contraseña');
      return;
    }
    
    if (!this.confirmPassword) {
      this.registerError = 'Debes confirmar la contraseña';
      console.error('Falta confirmación de contraseña');
      return;
    }
    
    if (!this.agreeTerms) {
      this.registerError = 'Debes aceptar los términos y condiciones';
      console.error('No acepta términos');
      return;
    }
    
    if (this.password !== this.confirmPassword) {
      this.registerError = 'Las contraseñas no coinciden';
      console.error('Contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.registerError = 'La contraseña debe tener al menos 6 caracteres';
      console.error('Contraseña muy corta');
      return;
    }
    
    console.log('Validaciones pasadas, procediendo con el registro...');
    
    this.loading = true;
    this.registerError = '';
    
    // Generar username basado en el email
    const username = this.email.split('@')[0].toLowerCase();
    console.log('Username generado:', username);
    
    const registerData: RegisterRequest = {
      username,
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    };
    
    console.log('Datos que se enviarán al servidor:', {
      ...registerData,
      password: '***'
    });
    
    console.log('Llamando al authService.register...');
    
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('===== RESPUESTA DEL SERVIDOR =====');
        console.log('Respuesta recibida:', response);
        
        if (response.ok) {
          console.log('REGISTRO EXITOSO!');
          console.log('Usuario creado:', response.user);
          console.log('Token recibido:', response.token ? 'SÍ' : 'NO');
          
          // Redirigir al inicio después del registro exitoso
          console.log('🔄 Redirigiendo al inicio...');
          this.router.navigate(['/']);
        } else {
          console.error('Registro fallido - servidor respondió con error');
          this.registerError = response.msg || 'Error en el registro';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('===== ERROR EN REGISTRO =====');
        console.error('Error completo:', error);
        console.error('Tipo de error:', typeof error);
        console.error('Stack trace:', error.stack);
        
        this.registerError = error || 'Error en el servidor. Inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
  
  goToLogin(): void {
    console.log('Navegando a login...');
    this.router.navigate(['/login']);
  }
  
  goToHome(): void {
    console.log('Navegando al inicio...');
    this.router.navigate(['/']);
  }
}