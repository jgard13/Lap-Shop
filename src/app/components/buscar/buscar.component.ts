import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../Services/product.service';
import { CarritoService } from '../../Services/carrito.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../producto-card/product-card.component';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './buscar.component.html',
  styleUrls: ['./buscar.component.css'],
})
export class BuscarComponent {
  query = '';
  results = signal<Product[]>([]);
  searching = signal(false);

  constructor(
    private productsService: ProductsService,
    private carritoService: CarritoService
  ) {}

  onSearch() {
    if (!this.query.trim()) {
      this.results.set([]);
      return;
    }

    this.searching.set(true);
    this.productsService.buscar(this.query).subscribe({
      next: (data) => {
        this.results.set(data);
        this.searching.set(false);
      },
      error: (err) => {
        console.error('Error buscando:', err);
        this.searching.set(false);
      }
    });
  }

  agregar(p: Product) {
    this.carritoService.agregar(p);
  }
}
