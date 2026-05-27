import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { CarritoService } from '../../Services/carrito.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() toggleCartEvent = new EventEmitter<void>();
  cartCount: any;

  constructor(
    public authService: AuthService,
    private carritoService: CarritoService,
    private router: Router
  ) {
    this.cartCount = this.carritoService.cantidad;
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }

  toggleCart() {
    this.toggleCartEvent.emit();
  }
}
