import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventarioService } from '../../Services/inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  productos: any[] = [];
  cargando = true;
  errorMsg = '';
  exitoMsg = '';

  // Formulario de edición/creación
  mostrarFormulario = false;
  editando = false;
  productoIdActual: number | null = null;

  // Campos del formulario
  nombre = '';
  precio: number | null = null;
  cpu = '';
  ram = '';
  memoria = '';
  gpu = '';
  tienda = 'Admin Manual';
  rutaimg = '';
  link = '';
  activo = true;

  constructor(
    private inventarioService: InventarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarInventario();
    }
  }

  cargarInventario(): void {
    this.cargando = true;
    this.inventarioService.getProductos().subscribe({
      next: (res) => {
        if (res.success) {
          this.productos = res.data;
        } else {
          this.errorMsg = 'No se pudieron cargar los productos.';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar inventario:', err);
        this.errorMsg = 'Error al conectar con el servidor de inventario.';
        this.cargando = false;
      }
    });
  }

  abrirCrear(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.productoIdActual = null;
    this.limpiarFormulario();
  }

  abrirEditar(prod: any): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.productoIdActual = prod.id;
    
    this.nombre = prod.nombre || '';
    this.precio = prod.precio !== undefined ? Number(prod.precio) : null;
    this.cpu = prod.cpu || '';
    this.ram = prod.ram || '';
    this.memoria = prod.memoria || '';
    this.gpu = prod.gpu || '';
    this.tienda = prod.tienda || 'Admin Manual';
    this.rutaimg = prod.rutaimg || '';
    this.link = prod.link || '';
    this.activo = prod.activo !== undefined ? prod.activo : true;

    this.exitoMsg = '';
    this.errorMsg = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.nombre = '';
    this.precio = null;
    this.cpu = '';
    this.ram = '';
    this.memoria = '';
    this.gpu = '';
    this.tienda = 'Admin Manual';
    this.rutaimg = '';
    this.link = '';
    this.activo = true;
  }

  guardarProducto(): void {
    if (!this.nombre || this.precio === null || this.precio <= 0) {
      this.errorMsg = 'Por favor, ingresa un nombre y un precio válido.';
      return;
    }

    const payload = {
      nombre: this.nombre,
      precio: this.precio,
      cpu: this.cpu || null,
      ram: this.ram || null,
      memoria: this.memoria || null,
      gpu: this.gpu || null,
      tienda: this.tienda,
      rutaimg: this.rutaimg || '',
      link: this.link || '#',
      activo: this.activo
    };

    this.errorMsg = '';
    this.exitoMsg = '';

    if (this.editando && this.productoIdActual !== null) {
      this.inventarioService.actualizarProducto(this.productoIdActual, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.exitoMsg = '¡Producto actualizado con éxito!';
            this.cargarInventario();
            setTimeout(() => {
              this.cerrarFormulario();
              this.exitoMsg = '';
            }, 1000);
          } else {
            this.errorMsg = res.mensaje || 'Error al actualizar producto.';
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Error al actualizar producto en el servidor.';
        }
      });
    } else {
      this.inventarioService.crearProducto(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.exitoMsg = '¡Producto creado con éxito!';
            this.cargarInventario();
            setTimeout(() => {
              this.cerrarFormulario();
              this.exitoMsg = '';
            }, 1000);
          } else {
            this.errorMsg = res.mensaje || 'Error al crear producto.';
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Error al crear producto en el servidor.';
        }
      });
    }
  }

  desactivarProducto(id: number): void {
    if (confirm('¿Estás seguro de que deseas desactivar (borrado virtual) este producto? Ya no aparecerá en el catálogo.')) {
      this.inventarioService.eliminarProducto(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.exitoMsg = 'Producto desactivado exitosamente.';
            this.cargarInventario();
            setTimeout(() => this.exitoMsg = '', 3000);
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Error al desactivar el producto.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    }
  }

  activarProducto(prod: any): void {
    const payload = {
      nombre: prod.nombre,
      precio: prod.precio,
      cpu: prod.cpu,
      ram: prod.ram,
      memoria: prod.memoria,
      gpu: prod.gpu,
      tienda: prod.tienda,
      rutaimg: prod.rutaimg,
      link: prod.link,
      activo: true
    };

    this.inventarioService.actualizarProducto(prod.id, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.exitoMsg = 'Producto reactivado con éxito.';
          this.cargarInventario();
          setTimeout(() => this.exitoMsg = '', 3000);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error al activar el producto.';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  filterSpecs(prod: any): string {
    return [prod.cpu, prod.ram, prod.memoria, prod.gpu].filter(Boolean).join(' | ') || 'N/A';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  }
}
