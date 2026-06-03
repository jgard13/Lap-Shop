import { Component, computed, EventEmitter, Output } from '@angular/core';
import { CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService, CartItem } from '../../Services/carrito.service';
import { LegalService } from '../../Services/legal.service';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
})
export class CarritoComponent {
  carrito: Signal<CartItem[]>;
  total = computed(() => this.carritoService.total());
  @Output() close = new EventEmitter<void>();

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    public legalService: LegalService
  ) {
    this.carrito = this.carritoService.items;
  }

  agregar(product: any) {
    this.carritoService.agregar(product);
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

  irACheckout() {
    this.router.navigate(['/checkout']);
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }
}
