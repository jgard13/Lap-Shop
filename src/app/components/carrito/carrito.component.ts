import { Component, computed, EventEmitter, Output } from '@angular/core';
import { CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { CarritoService } from '../../Services/carrito.service';
import { Product } from '../../models/product.model';
import { Signal } from '@angular/core';

import { CheckoutComponent } from '../checkout/checkout.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, CheckoutComponent],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
})
export class CarritoComponent {
  carrito: Signal<Product[]>;
  total = computed(() => this.carritoService.total());
  @Output() close = new EventEmitter<void>();

  constructor(private carritoService: CarritoService) {
    this.carrito = this.carritoService.productos;
  }

  quitar(id: number) {
    this.carritoService.quitar(id);
  }

  vaciar() {
    this.carritoService.vaciar();
  }

  exportarXML() {
    this.carritoService.exportarXML();
  }

  onClose() {
    this.close.emit();
  }
}

