import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductsService } from './product.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  /** Set reactivo con IDs de favoritos — BehaviorSubject para zone-based change detection */
  private _ids$ = new BehaviorSubject<Set<number>>(new Set());

  /** Observable público para el async pipe si se necesita */
  readonly ids$ = this._ids$.asObservable();

  constructor(
    private productsService: ProductsService,
    private authService: AuthService
  ) {
    // Cargar favoritos cuando haya sesión activa
    this.authService.usuarioActual$.subscribe(user => {
      if (user) {
        this.cargar(user.id);
      } else {
        this._ids$.next(new Set());
      }
    });
  }

  /** Obtener el Set actual */
  get ids(): Set<number> {
    return this._ids$.getValue();
  }

  /** Cargar IDs de favoritos del servidor */
  cargar(usuarioId: number): void {
    this.productsService.getFavoritos(usuarioId).subscribe({
      next: (favs) => {
        this._ids$.next(new Set(favs.map(f => f.id)));
      },
      error: (err) => {
        console.warn('No se pudieron cargar favoritos:', err?.status);
      }
    });
  }

  /** ¿Es este producto favorito? */
  esFavorito(productId: number): boolean {
    return this._ids$.getValue().has(productId);
  }

  /** Alterna el estado favorito de un producto — actualización optimista */
  toggleFavorito(productId: number): void {
    const user = this.authService.obtenerUsuarioActual();
    if (!user) return;

    const actual = this._ids$.getValue();

    if (actual.has(productId)) {
      // Quitar — actualizar UI de inmediato
      const nuevo = new Set(actual);
      nuevo.delete(productId);
      this._ids$.next(nuevo);
      this.productsService.quitarFavorito(productId).subscribe({
        error: () => {
          const rev = new Set(this._ids$.getValue());
          rev.add(productId);
          this._ids$.next(rev);
        }
      });
    } else {
      // Agregar — actualizar UI de inmediato
      const nuevo = new Set(actual);
      nuevo.add(productId);
      this._ids$.next(nuevo);
      this.productsService.agregarFavorito(productId).subscribe({
        error: () => {
          const rev = new Set(this._ids$.getValue());
          rev.delete(productId);
          this._ids$.next(rev);
        }
      });
    }
  }
}
