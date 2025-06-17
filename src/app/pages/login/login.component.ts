import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  loginError: string = '';
  loading: boolean = false;
  connectionStatus: string = '';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    // Probar conexión al inicializar
    this.testBackendConnection();
  }

  //  MÉTODO PARA PROBAR LA CONEXIÓN
  testBackendConnection(): void {
    console.log(' Probando conexión con el backend...');
    this.connectionStatus = 'Verificando conexión...';
    
    this.authService.testConnection().subscribe({
      next: (response) => {
        console.log(' Conexión exitosa:', response);
        this.connectionStatus = 'Conexión OK ';
        setTimeout(() => this.connectionStatus = '', 3000);
      },
      error: (error) => {
        console.error(' Error de conexión:', error);
        this.connectionStatus = `Error de conexión: ${error}`;
        this.loginError = 'No se puede conectar con el servidor. Verifica que esté funcionando.';
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.loginError = 'Por favor, completa todos los campos';
      return;
    }
    
    this.loading = true;
    this.loginError = '';
    
    const loginData: LoginRequest = {
      email: this.email.trim().toLowerCase(),
      password: this.password
    };
    
    console.log(' Enviando datos de login:', { email: loginData.email, password: '***' });
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log(' Respuesta recibida:', response);
        
        if (response.ok) {
          console.log(' Login exitoso:', response.user);
          
          if (response.user && response.user.role === 'admin') {
            this.router.navigate(['/admin/products']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.loginError = response.msg || 'Error en el inicio de sesión';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error(' Error en login:', error);
        this.loginError = error || 'Error en el servidor. Inténtalo de nuevo.';
        this.loading = false;
        
        // Si es un error de conexión, sugerir verificación
        if (error.includes('conexión')) {
          this.loginError += ' Verifica que el servidor backend esté funcionando en el puerto 8080.';
        }
      }
    });
  }
  
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
  
  goToHome(): void {
    this.router.navigate(['/']);
  }

  retryConnection(): void {
    this.loginError = '';
    this.testBackendConnection();
  }
}