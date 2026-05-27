import { Component, Inject, PLATFORM_ID, OnInit, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../Services/product.service';
import { CarritoService } from '../../Services/carrito.service';
import { ProductCardComponent } from '../producto-card/product-card.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css'],
})
export class CatalogoComponent implements OnInit {
  // Estado de productos y sugerencias
  products = signal<Product[]>([]);
  sugerenciaEspecialista = signal<Product | null>(null);

  // Opciones de Categorías
  categorias = [
    'Arquitectura',
    'Gaming',
    'Programación',
    'Diseño 3D',
    'Renderizado',
    'Edición',
    'Oficina',
    'Escuela'
  ];

  // Estado de filtros
  selectedCategorias = signal<string[]>([]);
  modoRequisitos = signal<string>('optimo'); // 'optimo' o 'minimo'
  precioMin = signal<number>(4500);
  precioMax = signal<number>(60000);
  maxSliderLimit = signal<number>(60000);

  // Estados de carga e información adicional
  mensajeSistema = signal<string>('');
  tipoMatch = signal<string>('Exacta');
  llmFeedback = signal<string>('');
  llmLoading = signal<boolean>(false);
  showSidebarMobile = signal<boolean>(false);

  private filterTimeout: any;

  constructor(
    private productsService: ProductsService,
    private carritoService: CarritoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCatalogoInicial(true);
    }
  }

  cargarCatalogoInicial(isInit: boolean = false) {
    this.productsService.getAll().pipe(
      timeout(8000),
      catchError((err: any) => {
        console.error('Error cargando productos:', err?.message || err);
        return of([] as Product[]);
      })
    ).subscribe({
      next: (data: Product[]) => {
        if (!isInit) {
          const minVal = this.precioMin();
          const maxVal = this.precioMax();
          this.products.set(data.filter(p => p.price >= minVal && p.price <= maxVal));
        } else {
          this.products.set(data);
          // Calcular el precio máximo dinámico para inicializar los sliders
          if (data.length > 0) {
            const precios = data.map(p => p.price).filter(p => p > 0);
            const maxPrice = precios.length > 0 ? Math.ceil(Math.max(...precios)) : 60000;
            this.maxSliderLimit.set(maxPrice);
            this.precioMax.set(maxPrice);
          }
        }
      },
      error: (err: any) => console.error('Error en suscripción:', err),
    });
  }

  agregar(producto: Product) {
    this.carritoService.agregar(producto);
  }

  // --- Manejadores de eventos de filtro ---

  toggleCategoria(cat: string) {
    const current = this.selectedCategorias();
    if (current.includes(cat)) {
      this.selectedCategorias.set(current.filter(c => c !== cat));
    } else {
      this.selectedCategorias.set([...current, cat]);
    }
    this.onFilterChange();
  }

  toggleModoRequisitos(event: any) {
    this.modoRequisitos.set(event.target.checked ? 'optimo' : 'minimo');
    this.onFilterChange();
  }

  onMinPriceChange(val: string) {
    const num = parseInt(val, 10) || 4500;
    const max = this.precioMax();
    const gap = 1000;
    if (max - num < gap) {
      this.precioMin.set(max - gap);
    } else {
      this.precioMin.set(num);
    }
    this.onFilterChange();
  }

  onMaxPriceChange(val: string) {
    const num = parseInt(val, 10) || 60000;
    const min = this.precioMin();
    const gap = 1000;
    if (num - min < gap) {
      this.precioMax.set(min + gap);
    } else {
      this.precioMax.set(num);
    }
    this.onFilterChange();
  }

  onFilterChange() {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.ejecutarFiltrado();
    }, 300);
  }

  ejecutarFiltrado() {
    const etiquetas = this.selectedCategorias();
    const minVal = this.precioMin();
    const maxVal = this.precioMax();
    const modo = this.modoRequisitos();

    // Si no hay etiquetas, cargar catálogo completo filtrado únicamente por rango de precio local
    if (etiquetas.length === 0) {
      this.mensajeSistema.set('');
      this.tipoMatch.set('Exacta');
      this.sugerenciaEspecialista.set(null);
      this.llmFeedback.set('');
      this.cargarCatalogoInicial();
      return;
    }

    this.productsService.filtrar(etiquetas, minVal, maxVal, modo).subscribe({
      next: (data) => {
        this.products.set(data.laptops);
        this.mensajeSistema.set(data.mensaje);
        this.tipoMatch.set(data.tipo);
        this.sugerenciaEspecialista.set(data.sugerencia);

        // Solicitar análisis del Asistente Técnico IA si hay resultados
        if (data.laptops.length > 0) {
          this.obtenerFeedbackIA(data.laptops);
        } else {
          this.llmFeedback.set('');
        }
      },
      error: (err) => {
        console.error('Error al filtrar productos:', err);
      }
    });
  }

  obtenerFeedbackIA(laptops: Product[]) {
    this.llmLoading.set(true);
    this.llmFeedback.set('Analizando especificaciones técnicas de los dispositivos...');
    
    this.productsService.obtenerFeedbackAsistente(
      laptops.slice(0, 3),
      this.selectedCategorias(),
      this.precioMin(),
      this.precioMax()
    ).subscribe({
      next: (res) => {
        this.llmFeedback.set(res.feedback);
        this.llmLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener feedback IA:', err);
        this.llmFeedback.set('He seleccionado estos modelos basándose en su excelente balance de componentes y su capacidad para ejecutar los programas que necesitas.');
        this.llmLoading.set(false);
      }
    });
  }

  toggleSidebarMobile() {
    this.showSidebarMobile.set(!this.showSidebarMobile());
  }

  // Helper para pintar el track del slider dual en CSS inline
  getRangePercentageLeft(): number {
    const min = this.precioMin();
    const limitMax = this.maxSliderLimit();
    const limitMin = 4500;
    return ((min - limitMin) / (limitMax - limitMin)) * 100;
  }

  getRangePercentageWidth(): number {
    const min = this.precioMin();
    const max = this.precioMax();
    const limitMax = this.maxSliderLimit();
    const limitMin = 4500;
    const minPct = ((min - limitMin) / (limitMax - limitMin)) * 100;
    const maxPct = ((max - limitMin) / (limitMax - limitMin)) * 100;
    return maxPct - minPct;
  }
}
