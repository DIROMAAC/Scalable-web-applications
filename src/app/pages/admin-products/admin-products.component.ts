import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ProductService } from '../../services/product.service';
import { Product, ClothingProduct, AccessoryProduct } from '../../interfaces/product.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  editingProduct: Product | null = null;
  isAddingProduct: boolean = false;
  isLoading: boolean = false;

  productForm = {
    id: '',
    name: '',
    price: 0,
    salePrice: 0,
    description: '',
    images: [''],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    gender: 'men' as 'men' | 'women',
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular',
    dimensions: '',
    adjustable: false,
    type: 'clothing' as 'clothing' | 'accessory'
  };

  constructor(
    public productService: ProductService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin) {
      this.router.navigate(['/']);
      return;
    }
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.loadProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        alert('Error loading products');
      }
    });
  }

  startAddProduct(): void {
    this.isAddingProduct = true;
    this.editingProduct = null;
    this.resetForm();
  }

  startEditProduct(product: Product): void {
    this.editingProduct = product;
    this.isAddingProduct = false;
    this.populateForm(product);
  }

  populateForm(product: Product): void {
    this.productForm = {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || 0,
      description: product.description,
      images: product.images?.length ? [...product.images] : [''],
      rating: product.rating || 5.0,
      reviewCount: product.reviewCount || 0,
      inStock: product.inStock !== false,
      gender: this.productService.isClothingProduct(product) ? product.gender : 'men',
      sizes: this.productService.isClothingProduct(product) ? [...product.sizes] : ['S', 'M', 'L', 'XL'],
      fit: this.productService.isClothingProduct(product) ? product.fit : 'Regular',
      dimensions: this.productService.isAccessoryProduct(product) ? product.dimensions || '' : '',
      adjustable: this.productService.isAccessoryProduct(product) ? product.adjustable || false : false,
      type: this.productService.isClothingProduct(product) ? 'clothing' : 'accessory'
    };
  }

  resetForm(): void {
    this.productForm = {
      id: '',
      name: '',
      price: 0,
      salePrice: 0,
      description: '',
      images: [''],
      rating: 5.0,
      reviewCount: 0,
      inStock: true,
      gender: 'men',
      sizes: ['S', 'M', 'L', 'XL'],
      fit: 'Regular',
      dimensions: '',
      adjustable: false,
      type: 'clothing'
    };
  }

  saveProduct(): void {
    if (!this.validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    const productData: any = {
      id: this.productForm.id || Date.now().toString(),
      name: this.productForm.name,
      price: this.productForm.price,
      description: this.productForm.description,
      images: this.productForm.images.filter(img => img.trim() !== ''),
      rating: this.productForm.rating,
      reviewCount: this.productForm.reviewCount,
      inStock: this.productForm.inStock,
      productType: this.productForm.type
    };

    if (this.productForm.salePrice > 0) {
      productData.salePrice = this.productForm.salePrice;
    }

    if (this.productForm.type === 'clothing') {
      productData.gender = this.productForm.gender;
      productData.sizes = this.productForm.sizes;
      productData.fit = this.productForm.fit;
    } else {
      productData.dimensions = this.productForm.dimensions;
      productData.adjustable = this.productForm.adjustable;
    }

    this.isLoading = true;
    const operation = this.isAddingProduct 
      ? this.productService.createProduct(productData)
      : this.productService.updateProduct(productData);

    operation.subscribe({
      next: () => {
        this.isLoading = false;
        this.cancelEdit();
        this.loadProducts();
        alert('Product saved successfully');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving product:', error);
        alert('Error saving product');
      }
    });
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.isLoading = true;
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadProducts();
          alert('Product deleted successfully');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error deleting product:', error);
          alert('Error deleting product');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingProduct = null;
    this.isAddingProduct = false;
    this.resetForm();
  }

  addImageField(): void {
    this.productForm.images.push('');
  }

  removeImageField(index: number): void {
    if (this.productForm.images.length > 1) {
      this.productForm.images.splice(index, 1);
    }
  }

  validateForm(): boolean {
    return !!(
      this.productForm.name &&
      this.productForm.price > 0 &&
      this.productForm.description &&
      this.productForm.images.filter(img => img.trim()).length > 0
    );
  }

  goToOrderManagement(): void {
    this.router.navigate(['/admin/orders']);
  }
}