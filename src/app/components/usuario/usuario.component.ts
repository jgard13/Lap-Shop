import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { ProductsService } from '../../Services/product.service';
import { Product } from '../../models/product.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit {
  usuario: Usuario | null = null;
  favoritos: Product[] = [];
  vistos: Product[] = [];
  cargandoFavoritos = true;
  cargandoVistos = true;

  constructor(
    private authService: AuthService,
    private productsService: ProductsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuarioActual();
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarFavoritos();
    this.cargarVistos();
  }

  cargarFavoritos(): void {
    if (!this.usuario) return;
    this.productsService.getFavoritos(this.usuario.id).subscribe({
      next: (data) => {
        this.favoritos = data;
        this.cargandoFavoritos = false;
      },
      error: (err) => {
        console.error('Error cargando favoritos:', err);
        this.cargandoFavoritos = false;
      }
    });
  }

  cargarVistos(): void {
    if (!this.usuario) return;
    this.productsService.getVistos(this.usuario.id).subscribe({
      next: (data) => {
        this.vistos = data;
        this.cargandoVistos = false;
      },
      error: (err) => {
        console.error('Error cargando historial:', err);
        this.cargandoVistos = false;
      }
    });
  }

  getIniciales(): string {
    return this.usuario?.usuario?.substring(0, 2).toUpperCase() || 'US';
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  }

  getProxyUrl(rawUrl: string): string {
    if (!rawUrl) return 'https://placehold.co/150x100?text=Sin+Imagen';
    return `https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(rawUrl.replace('http://', 'https://'))}`;
  }
}
