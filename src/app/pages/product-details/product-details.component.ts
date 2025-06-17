import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../interfaces/product.interface';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, NgIf, NgFor, CurrencyPipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  currentImageIndex = 0;
  selectedSize = '';
  isLoading = true;
  errorMessage = '';
  quantity = 1;
  successMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public productService: ProductService,
    private cartService: CartService,
    private authService: AuthService  
  ) {}
  
  ngOnInit(): void {
    this.productService.resetFilters();
    const id = this.route.snapshot.params['id'];
    
    // Primero intentar obtener el producto de la caché
    const cachedProduct = this.productService.getProductByIdSync(id);
    if (cachedProduct) {
      this.product = cachedProduct;
      this.isLoading = false;
      this.initializeSelectedSize();
    } else {
      // Si no está en caché, buscarlo en la API
      this.productService.getProductById(id).subscribe({
        next: (product) => {
          this.product = product;
          this.isLoading = false;
          
          if (!this.product) {
            this.errorMessage = 'Producto no encontrado';
            setTimeout(() => this.router.navigate(['/not-found']), 2000);
          } else {
            this.initializeSelectedSize();
          }
        },
        error: (error) => {
          console.error('Error al cargar el producto:', error);
          this.errorMessage = 'Error al cargar el producto';
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/not-found']), 2000);
        }
      });
    }
  }
  
  initializeSelectedSize(): void {
    if (this.product && this.productService.isClothingProduct(this.product) && this.product.sizes.length > 0) {
      this.selectedSize = this.product.sizes[0];
    }
  }
  
  onSearch(searchTerm: string): void {
    this.productService.querySearch = searchTerm;
    this.productService.applyFilters();
    this.router.navigate(['/']);
  }
  
  goBack(): void {
    this.router.navigate(['/']);
  }

  //  Añadir al carrito
  addToCart(): void {
    if (!this.product) return;

    try {
      // Para productos de ropa, la talla es requerida
      if (this.productService.isClothingProduct(this.product)) {
        if (!this.selectedSize) {
          this.errorMessage = 'Por favor, selecciona una talla';
          setTimeout(() => this.errorMessage = '', 3000);
          return;
        }
        this.cartService.addToCart(this.product, this.quantity, this.selectedSize);
      } else {
        // Para accesorios, no se requiere talla
        this.cartService.addToCart(this.product, this.quantity);
      }

      // Mostrar mensaje de éxito
      this.successMessage = `${this.product.name} añadido al carrito`;
      setTimeout(() => this.successMessage = '', 3000);
      
      console.log(' Producto añadido al carrito:', this.product.name);
      
    } catch (error: any) {
      console.error('Error añadiendo al carrito:', error);
      this.errorMessage = error.message || 'Error al añadir el producto al carrito';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  //  Incrementar cantidad
  incrementQuantity(): void {
    this.quantity++;
  }

  //  Decrementar cantidad
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  //  Verificar si está en el carrito
  get isInCart(): boolean {
    if (!this.product) return false;
    return this.cartService.isInCart(this.product.id, this.selectedSize);
  }

  //  Ir al carrito
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}