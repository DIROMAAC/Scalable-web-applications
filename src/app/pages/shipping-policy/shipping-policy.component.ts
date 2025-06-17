import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-shipping-policy',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './shipping-policy.component.html',
  styleUrl: './shipping-policy.component.css'
})
export class ShippingPolicyComponent {
  // Esta página es principalmente informativa, así que no necesita mucha lógica
}