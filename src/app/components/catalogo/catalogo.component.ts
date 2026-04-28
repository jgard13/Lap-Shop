import { Component, computed, signal, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../Services/product.service';
import { CarritoService } from '../../Services/carrito.service';
import { ProductCardComponent } from '../producto-card/product-card.component';
import { CarritoComponent } from '../carrito/carrito.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCardComponent, CarritoComponent, RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css'],
})
export class CatalogoComponent implements OnInit {
  products = signal<Product[]>([]);
  inStockCount = computed(() => this.products().filter(p => p.inStock).length);
  cartVisible = signal(false);
  cartCount: any;
  menuOpen = signal(false);

  constructor(
    private productsService: ProductsService,
    private carritoService: CarritoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.cartCount = this.carritoService.cantidad;
  }

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

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
  }

  toggleCart() {
    this.cartVisible.set(!this.cartVisible());
  }
}
