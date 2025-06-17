import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product, ClothingProduct, AccessoryProduct } from '../interfaces/product.interface';
import { environment } from '../environment/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = environment.apiUrl;
  private productsCache: Product[] = [];
  private productsLoaded = false;
  private filteredProductsSubject = new BehaviorSubject<Product[]>([]);
  public filteredProducts$ = this.filteredProductsSubject.asObservable();

  //  Nuevas propiedades para filtros
  public querySearch: string = '';
  public categoryFilter: string = '';
  public priceRange: { min: number; max: number } = { min: 0, max: Infinity };

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadProducts().subscribe();
  }

  //  Type guards
  isClothingProduct(product: Product): product is ClothingProduct {
    return product.productType === 'clothing';
  }

  isAccessoryProduct(product: Product): product is AccessoryProduct {
    return product.productType === 'accessory';
  }

  private normalizeProductId(product: Product | string): string {
    if (typeof product === 'string') return product;
    return product.id || product._id || '';
  }

  private addToCache(product: Product): void {
    const index = this.productsCache.findIndex(p => 
      this.normalizeProductId(p) === this.normalizeProductId(product)
    );
    if (index >= 0) {
      this.productsCache[index] = product;
    } else {
      this.productsCache.push(product);
    }
    this.applyFilters();
  }

  loadProducts(): Observable<Product[]> {
    return this.http.get<{ ok: boolean; products: Product[] }>(`${this.apiUrl}/products`).pipe(
      map(response => {
        if (response?.ok && Array.isArray(response.products)) {
          this.productsCache = response.products;
          this.productsLoaded = true;
          this.applyFilters();
          return this.productsCache;
        }
        throw new Error('Invalid response format');
      }),
      catchError(error => {
        console.error('Error loading products:', error);
        return of([]);
      })
    );
  }

  getProductById(id: string): Observable<Product | null> {
    const cached = this.productsCache.find(p => this.normalizeProductId(p) === id);
    if (cached) return of(cached);

    return this.http.get<{ ok: boolean; product: Product }>(`${this.apiUrl}/products/${id}`).pipe(
      map(response => response?.ok ? response.product : null),
      catchError(() => of(null))
    );
  }

  //  Método sincrónico para obtener producto por ID
  getProductByIdSync(id: string): Product | null {
    return this.productsCache.find(p => this.normalizeProductId(p) === id) || null;
  }

  createProduct(productData: Partial<Product>): Observable<Product> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<{ ok: boolean; product: Product }>(
      `${this.apiUrl}/products`,
      productData,
      { headers }
    ).pipe(
      map(response => {
        if (!response?.ok) throw new Error('Create failed');
        this.addToCache(response.product);
        return response.product;
      })
    );
  }

  updateProduct(productData: Partial<Product>): Observable<Product> {
    const headers = this.authService.getAuthHeaders();
    const id = this.normalizeProductId(productData as Product);
    return this.http.put<{ ok: boolean; product: Product }>(
      `${this.apiUrl}/products/${id}`,
      productData,
      { headers }
    ).pipe(
      map(response => {
        if (!response?.ok) throw new Error('Update failed');
        this.addToCache(response.product);
        return response.product;
      })
    );
  }

  deleteProduct(id: string): Observable<boolean> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/products/${id}`, { headers }).pipe(
      map(response => {
        if (response?.ok) {
          this.productsCache = this.productsCache.filter(
            p => this.normalizeProductId(p) !== id
          );
          this.applyFilters();
          return true;
        }
        return false;
      })
    );
  }

  //  Filtering method actualizado
  applyFilters(): void {
    if (!this.productsLoaded) return;

    let filtered = [...this.productsCache];

    if (this.querySearch.trim()) {
      const term = this.querySearch.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }

    if (this.categoryFilter) {
      filtered = filtered.filter(p => {
        if (this.isClothingProduct(p)) {
          return p.gender === this.categoryFilter;
        }
        if (this.isAccessoryProduct(p)) {
          return this.categoryFilter === 'accessories';
        }
        return false;
      });
    }

    if (this.priceRange) {
      filtered = filtered.filter(p => 
        p.price >= this.priceRange.min && p.price <= this.priceRange.max
      );
    }

    this.filteredProductsSubject.next(filtered);
  }


  getFeaturedProducts(limit: number = 4): Observable<Product[]> {
    return of([...this.productsCache]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
    );
  }

  getNewArrivals(limit: number = 4): Observable<Product[]> {
    return of([...this.productsCache]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit)
    );
  }

  getOnSaleProducts(): Observable<Product[]> {
    return of(this.productsCache.filter(p => p.salePrice != null));
  }

  resetFilters(): void {
    this.querySearch = '';
    this.categoryFilter = '';
    this.priceRange = { min: 0, max: Infinity };
    this.applyFilters();
  }

  resetCategoryAndPriceFilters(): void {
    this.categoryFilter = '';
    this.priceRange = { min: 0, max: Infinity };
  }

  resetSearch(): void {
    this.querySearch = '';
  }

  orderByName(): void {
    const sorted = [...this.filteredProductsSubject.value].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    this.filteredProductsSubject.next(sorted);
  }

  orderByPrice(ascending: boolean): void {
    const sorted = [...this.filteredProductsSubject.value].sort((a, b) =>
      ascending ? a.price - b.price : b.price - a.price
    );
    this.filteredProductsSubject.next(sorted);
  }
}
