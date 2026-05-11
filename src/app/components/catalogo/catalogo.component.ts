import { Component, Inject, PLATFORM_ID, OnInit, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { timeout, catchError, of } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../Services/product.service';
import { CarritoService } from '../../Services/carrito.service';
import { ProductCardComponent } from '../producto-card/product-card.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCardComponent, CommonModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css'],
})
export class CatalogoComponent implements OnInit {
  products = signal<Product[]>([]);

  constructor(
    private productsService: ProductsService,
    private carritoService: CarritoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Solo hacer peticiones HTTP en el navegador, no en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.productsService.getAll().pipe(
        timeout(8000),
        catchError((err: any) => {
          console.error('Error cargando productos:', err?.message || err);
          return of([] as Product[]);
        })
      ).subscribe({
        next: (data: Product[]) => this.products.set(data),
        error: (err: any) => console.error('Error en suscripción:', err),
      });
    }
  }

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
  }
}
