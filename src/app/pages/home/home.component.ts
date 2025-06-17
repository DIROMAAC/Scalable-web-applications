import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { Product } from '../../interfaces/product.interface';

// Importar los componentes que uses en el template
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true, // Si usas standalone components
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ProductCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Propiedades existentes
  featuredProducts: Product[] = [];
  newProducts: Product[] = [];
  saleProducts: Product[] = [];
  isLoading = false;
  allProducts: Product[] = [];
  // Propiedades faltantes que usa el template
  products: Product[] = []; // Esta es la que usa *ngFor en el template
  activeCategory: string = 'all';
  activeSorting: string = '';
  selectedPriceRange = { min: 0, max: 1000 };
  
  constructor(
    private productService: ProductService,
    private router: Router,
  ) {}
  
  ngOnInit(): void {
    this.loadAllProducts(); // Carga todos los productos una sola vez
  }
  
  loadProducts(): void {
    this.isLoading = true;
    
    // Cargar productos destacados
    this.productService.getFeaturedProducts(4).subscribe(products => {
      this.featuredProducts = products;
    });
    
    // Cargar productos nuevos
    this.productService.getNewArrivals(4).subscribe(products => {
      this.newProducts = products;
      this.isLoading = false;
    });
    
    // Cargar productos en oferta
    this.productService.getOnSaleProducts().subscribe(products => {
      this.saleProducts = products.slice(0, 4);
    });
  }
  
  // Nuevo método para cargar todos los productos
  loadAllProducts(): void {
    this.productService.loadProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyAllFilters(); // Aplicar filtros iniciales
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
      }
    });
  }
  
  // Métodos faltantes que usa el template
  // Función helper para obtener la categoría de un producto
  private getProductCategory(product: Product): string {
    if (product.productType === 'clothing') {
      return product.gender; // 'men' | 'women'
    }
    if (product.productType === 'accessory') {
      return 'accessories';
    }
    return 'unknown';
  }

  onSearch(searchTerm: string): void {
    if (searchTerm.trim()) {
      this.products = this.allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      this.applyAllFilters();
    }
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  onFilterByCategory(category: string): void {
    this.activeCategory = category;
    this.applyAllFilters();
  }

  onOrderByName(): void {
    this.activeSorting = 'name';
    this.applyAllFilters();
  }

  onOrderByPrice(ascending: boolean): void {
    this.activeSorting = ascending ? 'price-asc' : 'price-desc';
    this.applyAllFilters();
  }

  onFilterByPriceRange(range: {min: number, max: number}): void {
    this.selectedPriceRange = range;
    this.applyAllFilters();
  }
  
  // Método corregido para el evento del product-card
  onProductDetails(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  private applyAllFilters(): void {
    let filteredProducts = [...this.allProducts];
    
    // Aplicar filtro de categoría
    if (this.activeCategory !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        if (product.productType === 'clothing') return product.gender === this.activeCategory;
        if (product.productType === 'accessory') return this.activeCategory === 'accessories';
        return false;
      });
    }
    
    // Aplicar filtro de precio
    filteredProducts = filteredProducts.filter(product => {
      const price = product.salePrice || product.price;
      return price >= this.selectedPriceRange.min && price <= this.selectedPriceRange.max;
    });
    
    // Aplicar ordenación
    switch(this.activeSorting) {
      case 'name':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        filteredProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
    }
    
    this.products = filteredProducts.slice(0, 6);

  }
}