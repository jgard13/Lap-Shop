import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';
import { ProductsService } from '../../Services/product.service';
import { Product } from '../../models/product.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit {
  usuario: Usuario | null = null;
  favoritos: Product[] = [];
  vistos: Product[] = [];
  pedidos: any[] = [];
  
  cargandoFavoritos = true;
  cargandoVistos = true;
  cargandoPedidos = true;

  pedidoSeleccionado: any | null = null;

  mostrarTodosFavoritos = false;
  limiteFavoritos = 5;

  // Estado de edición de perfil
  editando = false;
  editUsuario = '';
  editCorreo = '';
  editContrasena = '';
  editContrasenaConfirmar = '';
  
  cargandoGuardar = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private productsService: ProductsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    this.usuario = this.authService.obtenerUsuarioActual();
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarFavoritos();
    this.cargarVistos();
    this.cargarPedidos();
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

  cargarPedidos(): void {
    this.authService.obtenerHistorialPedidos().subscribe({
      next: (res) => {
        if (res.success) {
          this.pedidos = res.data;
        }
        this.cargandoPedidos = false;
      },
      error: (err) => {
        console.error('Error cargando historial de pedidos:', err);
        this.cargandoPedidos = false;
      }
    });
  }

  iniciarEdicion(): void {
    if (!this.usuario) return;
    this.editUsuario = this.usuario.usuario;
    this.editCorreo = this.usuario.correo;
    this.editContrasena = '';
    this.editContrasenaConfirmar = '';
    this.mensajeExito = '';
    this.mensajeError = '';
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
  }

  guardarPerfil(): void {
    if (!this.editUsuario || !this.editCorreo) {
      this.mensajeError = 'Nombre de usuario y correo son requeridos.';
      return;
    }

    // Validar coincidencia de nueva contraseña
    if (this.editContrasena) {
      if (this.editContrasena.length < 6) {
        this.mensajeError = 'La nueva contraseña debe tener al menos 6 caracteres.';
        return;
      }
      if (this.editContrasena !== this.editContrasenaConfirmar) {
        this.mensajeError = 'Las contraseñas no coinciden.';
        return;
      }
    }

    this.cargandoGuardar = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.authService.actualizarPerfil(
      this.editUsuario,
      this.editCorreo,
      this.editContrasena ? this.editContrasena : undefined
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Conservar el token JWT existente al actualizar el usuario local
          const tokenActual = this.authService.obtenerToken();
          const usuarioActualizado: Usuario = {
            ...res.data,
            token: tokenActual || undefined
          };

          this.authService.establecerUsuario(usuarioActualizado);
          this.usuario = usuarioActualizado;
          
          this.mensajeExito = '¡Perfil actualizado con éxito!';
          setTimeout(() => {
            this.editando = false;
            this.mensajeExito = '';
          }, 1500);
        } else {
          this.mensajeError = res.message || 'Error al actualizar perfil.';
        }
        this.cargandoGuardar = false;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.mensajeError = err.error?.message || 'Error al guardar los cambios.';
        this.cargandoGuardar = false;
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

  abrirTicket(pedido: any): void {
    this.pedidoSeleccionado = pedido;
  }

  cerrarTicket(): void {
    this.pedidoSeleccionado = null;
  }

  obtenerSubtotal(total: number): number {
    return total / 1.16;
  }

  obtenerIVA(total: number): number {
    return total - (total / 1.16);
  }

  descargarXMLTicket(pedido: any): void {
    if (!pedido || !pedido.items) return;
    
    const subtotal = this.obtenerSubtotal(pedido.total);
    const impuestos = this.obtenerIVA(pedido.total);
    const total = pedido.total;
    
    const fmt = (n: number) => n.toFixed(2);
    const fecha = pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toISOString() : new Date().toISOString();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Recibo Fecha="${fecha}" OrdenPayPal="${pedido.paypal_order_id}" Moneda="MXN">\n`;
    xml += `  <Resumen>\n`;
    xml += `    <Subtotal>${fmt(subtotal)}</Subtotal>\n`;
    xml += `    <IVA>${fmt(impuestos)}</IVA>\n`;
    xml += `    <Total>${fmt(total)}</Total>\n`;
    xml += `  </Resumen>\n`;
    xml += `  <Detalles>\n`;
    
    for (const item of pedido.items) {
      const cantidad = item.cantidad || item.quantity || 1;
      const valorUnitario = item.precio || item.price || 0;
      const importe = cantidad * valorUnitario;
      const descripcion = item.nombre || item.name || 'Laptop';
      
      xml += `    <Producto>\n`;
      xml += `      <Id>${item.computadora_id || 'N/A'}</Id>\n`;
      xml += `      <Nombre>${descripcion}</Nombre>\n`;
      xml += `      <Cantidad>${cantidad}</Cantidad>\n`;
      xml += `      <Precio>${fmt(valorUnitario)}</Precio>\n`;
      xml += `      <Importe>${fmt(importe)}</Importe>\n`;
      xml += `    </Producto>\n`;
    }
    
    xml += `  </Detalles>\n`;
    xml += `  <Pago>\n`;
    xml += `    <Metodo>PayPal</Metodo>\n`;
    xml += `    <Estado>${pedido.estado || 'Completado'}</Estado>\n`;
    xml += `  </Pago>\n`;
    xml += `</Recibo>`;
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo_${pedido.paypal_order_id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  }

  getProxyUrl(rawUrl: string): string {
    if (!rawUrl) return 'https://placehold.co/150x100?text=Sin+Imagen';
    return `https://proxy.duckduckgo.com/iu/?u=${encodeURIComponent(rawUrl.replace('http://', 'https://'))}`;
  }
}
