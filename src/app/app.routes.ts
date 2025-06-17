import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductDetailsComponent } from './pages/product-details/product-details.component';
import { MensProductsComponent } from './pages/mens-products/mens-products.component';
import { WomensProductsComponent } from './pages/womens-products/womens-products.component';
import { AccessoriesComponent } from './pages/accessories/accessories.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AdminProductsComponent } from './pages/admin-products/admin-products.component';
import { ShippingPolicyComponent } from './pages/shipping-policy/shipping-policy.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'product/:id',
    component: ProductDetailsComponent
  },
  {
    path: 'products/men',
    component: MensProductsComponent
  },
  {
    path: 'products/women',
    component: WomensProductsComponent
  },
  {
    path: 'products/accessories',
    component: AccessoriesComponent
  },
  {
    path: 'search',
    component: SearchResultsComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard] // Requiere autenticación
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard] // Requiere autenticación
  },
  {
    path: 'admin/products',
    component: AdminProductsComponent,
    canActivate: [adminGuard] // Requiere ser admin
  },
  {
    path: 'admin/orders',
    component: AdminOrdersComponent,
    canActivate: [adminGuard] // Si hay guard de admin
  },
  {
    path: 'shipping-policy',
    component: ShippingPolicyComponent
  },
  {
    path: 'order-confirmation/:id',
    component: OrderConfirmationComponent
  },
  {
    path: 'not-found',
    component: NotFoundComponent
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];