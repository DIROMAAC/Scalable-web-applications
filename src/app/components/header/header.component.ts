// src/app/components/header/header.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, FormsModule, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() 
  searchEvent = new EventEmitter<string>();
  
  searchTerm: string = ''; 
  isMenuOpen = false;
  cartItemCount = 0;
  
  constructor(
    private router: Router, 
    private authService: AuthService,
    private cartService: CartService
  ) {
    // Suscribirse a los cambios del carrito
    this.cartService.cartTotals$.subscribe(totals => {
      this.cartItemCount = totals.itemCount;
    });
  }
  
  // Método para manejar la búsqueda
  onSearch(term: string): void {
    if (term.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: term } });
    }
  }
  
  // Método para manejar cambios en tiempo real
  onSearchInput(): void {
    this.searchEvent.emit(this.searchTerm);
  }
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.isMenuOpen = false;
  }
  
  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    
    if (this.router.url.includes('/search')) {
      this.router.navigate(['/']);
    } else {
      this.searchEvent.emit('');
    }
  }

  // Getter para verificar si el usuario es admin
  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  // Getter para verificar si está autenticado
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  // Método para logout
  logout(): void {
    this.authService.logout();
  }
}