import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-details/product-details.component').then(m => m.ProductDetailsComponent)
  },
  {
    path: 'products/men',
    loadComponent: () => import('./pages/mens-products/mens-products.component').then(m => m.MensProductsComponent)
  },
  {
    path: 'products/women',
    loadComponent: () => import('./pages/womens-products/womens-products.component').then(m => m.WomensProductsComponent)
  },
  {
    path: 'products/accessories',
    loadComponent: () => import('./pages/accessories/accessories.component').then(m => m.AccessoriesComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-results/search-results.component').then(m => m.SearchResultsComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard] // Requiere autenticación
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard] // Requiere autenticación
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
    canActivate: [authGuard] // Requiere autenticación
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./pages/admin-products/admin-products.component').then(m => m.AdminProductsComponent),
    canActivate: [adminGuard] // Requiere ser admin
  },
  {
    path: 'admin/orders',
    loadComponent: () => import('./pages/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
    canActivate: [adminGuard] // Si hay guard de admin
  },
  {
    path: 'shipping-policy',
    loadComponent: () => import('./pages/shipping-policy/shipping-policy.component').then(m => m.ShippingPolicyComponent)
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];