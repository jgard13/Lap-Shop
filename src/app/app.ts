import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { filter } from 'rxjs';
import { LegalService } from './Services/legal.service';
import { PRIVACIDAD_TEXT, TERMINOS_TEXT } from './models/legal-text';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CarritoComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  cartVisible = signal(false);
  showHeader = signal(true);
  loadingRoute = signal(false);

  constructor(
    private router: Router,
    public legalService: LegalService
  ) {}

  getLegalTitle(): string {
    const tipo = this.legalService.tipoDocumentoVisible();
    return tipo === 'terminos' ? 'Términos y Condiciones' : 'Aviso de Privacidad';
  }

  getLegalContent(): string {
    const tipo = this.legalService.tipoDocumentoVisible();
    return tipo === 'terminos' ? TERMINOS_TEXT : PRIVACIDAD_TEXT;
  }

  ngOnInit() {
    // Escuchar eventos de navegación global para la barra de progreso
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loadingRoute.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Un pequeño retraso para que sea visible en transiciones ultra rápidas
        setTimeout(() => {
          this.loadingRoute.set(false);
        }, 200);
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.showHeader.set(!url.includes('/login') && !url.includes('/registro'));
    });
  }

  onToggleCart() {
    this.cartVisible.set(!this.cartVisible());
  }
}
