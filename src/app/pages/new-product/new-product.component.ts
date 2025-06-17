import { Component } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { ClothingProduct, AccessoryProduct } from '../../interfaces/product.interface';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, FormsModule, NgIf],
  templateUrl: './new-product.component.html',
  styleUrl: './new-product.component.css'
})
export class NewProductComponent {
  productType: 'clothing' | 'accessory' = 'clothing';
  
  // Campos comunes
  name: string = '';
  price: number = 0;
  salePrice?: number;
  description: string = '';
  imageUrl: string = '';
  rating: number = 5.0;
  reviewCount: number = 0;
  inStock: boolean = true;
  
  // Campos para ropa
  gender: 'men' | 'women' = 'men';
  sizesInput: string = 'S, M, L, XL';
  fit: string = 'Regular';
  
  // Campos para accesorios
  dimensions?: string;
  adjustable: boolean = false;
  
  constructor(
    private productService: ProductService,
    private router: Router
  ) {}
  
  onSubmit(): void {
    // Validación básica
    if (!this.name || !this.price || !this.description || !this.imageUrl) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }
    
    // Generar ID único
    const newId = Date.now().toString();
    
    if (this.productType === 'clothing') {
      // Convertir string de tallas en array
      const sizes = this.sizesInput.split(',').map(size => size.trim());
      
      const newProduct: ClothingProduct = {
        id: newId,
        name: this.name,
        price: this.price,
        description: this.description,
        images: [this.imageUrl],
        rating: this.rating,
        reviewCount: this.reviewCount,
        inStock: this.inStock,
        gender: this.gender,
        sizes: sizes,
        fit: this.fit,
        productType: 'clothing'
      };
      
      if (this.salePrice && this.salePrice > 0) {
        newProduct.salePrice = this.salePrice;
      }
      
      this.productService.createProduct(newProduct).subscribe(product => {
        console.log('Clothing product created successfully:', product);
      });
      
    } else {
      const newProduct: AccessoryProduct = {
        id: newId,
        name: this.name,
        price: this.price,
        description: this.description,
        images: [this.imageUrl],
        rating: this.rating,
        reviewCount: this.reviewCount,
        inStock: this.inStock,
        adjustable: this.adjustable,
        productType: 'accessory'
      };
      
      if (this.salePrice && this.salePrice > 0) {
        newProduct.salePrice = this.salePrice;
      }
      
      if (this.dimensions) {
        newProduct.dimensions = this.dimensions;
      }
      
      this.productService.createProduct(newProduct).subscribe(product => {
        console.log('Accessory product created successfully:', product);
      });
    }
    
    this.router.navigate(['/']);
  }
  
  cancel(): void {
    this.router.navigate(['/']);
  }
}