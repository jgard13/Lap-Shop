import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { FavoritosService } from '../../Services/favoritos.service';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();
  added = false;

  private router = inject(Router);
  readonly favoritosService = inject(FavoritosService);
  private authService = inject(AuthService);

  /** Leído en cada ciclo de CD — el BehaviorSubject notifica a zone.js */
  get esFavorito(): boolean {
    return this.favoritosService.esFavorito(this.product.id);
  }

  get estaLogueado(): boolean {
    return this.authService.estaAutenticado();
  }

  goToDetail() {
    this.router.navigate(['/producto', this.product.id]);
  }

  onAdd(event: Event) {
    event.stopPropagation();
    this.added = true;
    this.add.emit(this.product);
    setTimeout(() => (this.added = false), 800);
  }

  onToggleFavorito(event: Event) {
    event.stopPropagation();
    if (!this.estaLogueado) {
      this.router.navigate(['/login']);
      return;
    }
    this.favoritosService.toggleFavorito(this.product.id);
  }
}
