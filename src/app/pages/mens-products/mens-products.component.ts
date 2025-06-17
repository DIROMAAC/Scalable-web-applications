import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ControlsComponent } from '../../components/controls/controls.component';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-mens-products',
  standalone: true,
  imports: [ProductCardComponent, ControlsComponent, HeaderComponent, FooterComponent, NgFor, NgIf, AsyncPipe],
  templateUrl: './mens-products.component.html',
  styleUrl: './mens-products.component.css'
})
export class MensProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    public productService: ProductService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.productService.resetFilters();
    this.productService.categoryFilter = 'men';
    this.productService.priceRange = { min: 0, max: 1000 };
    this.productService.applyFilters();

    this.productService.filteredProducts$.subscribe(products => {
      this.products = products.filter(p => 
        this.productService.isClothingProduct(p) && p.gender === 'men'
      );
    });
  }

  onSearch(searchTerm: string): void {
    this.productService.querySearch = searchTerm;
    this.productService.applyFilters();
  }

  onOrderByName(): void {
    this.productService.orderByName();
  }

  onOrderByPrice(ascending: boolean): void {
    this.productService.orderByPrice(ascending);
  }

  onFilterByPriceRange(range: { min: number, max: number }): void {
    this.productService.priceRange = range;
    this.productService.applyFilters();
  }

  onProductDetails(id: string): void {
    this.router.navigate(['/product', id]);
  }

}