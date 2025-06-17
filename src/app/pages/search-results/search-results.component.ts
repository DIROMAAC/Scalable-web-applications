import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ControlsComponent } from '../../components/controls/controls.component';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [ProductCardComponent, ControlsComponent, HeaderComponent, FooterComponent, NgFor, NgIf, AsyncPipe],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.css'
})
export class SearchResultsComponent implements OnInit {
  searchTerm: string = '';
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    public productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.productService.resetCategoryAndPriceFilters();

    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['q'] || '';
      this.productService.querySearch = this.searchTerm;
      this.productService.applyFilters();
    });

    this.productService.filteredProducts$.subscribe(products => {
      this.products = products;
      this.isLoading = false;
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.router.navigate(['/search'], { queryParams: { q: term }, replaceUrl: true });
    this.productService.querySearch = term;
    this.productService.applyFilters();
  }

  onOrderByName(): void {
    this.productService.orderByName();
  }

  onOrderByPrice(ascending: boolean): void {
    this.productService.orderByPrice(ascending);
  }

  onFilterByCategory(category: string): void {
    this.productService.categoryFilter = category === 'all' ? '' : category;
    this.productService.applyFilters();
  }

  onFilterByPriceRange(range: { min: number; max: number }): void {
    this.productService.priceRange = range;
    this.productService.applyFilters();
  }

  onProductDetails(id: string): void {
    this.router.navigate(['/product', id]);
  }

}
