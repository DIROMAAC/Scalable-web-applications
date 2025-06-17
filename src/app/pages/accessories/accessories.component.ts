import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ControlsComponent } from '../../components/controls/controls.component';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-accessories',
  standalone: true,
  imports: [ProductCardComponent, ControlsComponent, HeaderComponent, FooterComponent, NgFor, NgIf, AsyncPipe],
  templateUrl: './accessories.component.html',
  styleUrl: './accessories.component.css'
})
export class AccessoriesComponent implements OnInit {
  
  constructor(
    public productService: ProductService,
    private router: Router,
  ) {}
  
  ngOnInit(): void {
    // Establecer filtro para solo mostrar accesorios
    this.productService.resetSearch();
    this.productService.priceRange = {min: 0, max: 1000};
    this.productService.categoryFilter = 'accessories';
    this.productService.applyFilters();
  }
  
  onSearch(searchTerm: string): void {
    this.productService.querySearch = searchTerm;
  }
  
  onOrderByName(): void {
    this.productService.orderByName();
  }
  
  onOrderByPrice(ascending: boolean): void {
    this.productService.orderByPrice(ascending);
  }
  
  onFilterByPriceRange(range: {min: number, max: number}): void {
    this.productService.priceRange = range;
  }
  
  onProductDetails(id: string): void {
    this.router.navigate(['/product', id]);
  }

}