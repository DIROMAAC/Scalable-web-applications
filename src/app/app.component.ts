// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'GymStyle';

  constructor(
    private authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    // Pequeño delay para asegurar que los servicios estén completamente inicializados
    setTimeout(() => {
      if (this.authService.isAuthenticated) {
        this.authService.verifyToken().subscribe({
          next: (response) => {
            console.log('Token verificado:', response);
          },
          error: (error) => {
            console.error('Error verificando token:', error);
          }
        });
      }
    }, 100);
  }
}