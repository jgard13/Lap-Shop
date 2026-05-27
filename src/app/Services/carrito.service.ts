import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  // Lista reactiva del carrito
  private itemsSignal = signal<CartItem[]>([]);

  // Exponer como readonly
  items = this.itemsSignal.asReadonly();

  // Señal computada con la cantidad de productos total
  cantidad = computed(() => this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Suscribirse a los cambios de sesión para cargar el carrito del usuario correspondiente
      this.authService.usuarioActual$.subscribe(user => {
        const key = user ? `carrito_items_${user.usuario}` : 'carrito_items_invitado';
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            this.itemsSignal.set(JSON.parse(saved));
          } else {
            this.itemsSignal.set([]);
          }
        } catch (e) {
          console.error('Error al cargar el carrito de localStorage:', e);
          this.itemsSignal.set([]);
        }
      });

      // Sincronizar automáticamente cualquier cambio en el carrito con la clave de sesión activa
      effect(() => {
        const user = this.authService.obtenerUsuarioActual();
        const key = user ? `carrito_items_${user.usuario}` : 'carrito_items_invitado';
        try {
          localStorage.setItem(key, JSON.stringify(this.itemsSignal()));
        } catch (e) {
          console.error('Error al guardar el carrito en localStorage:', e);
        }
      });
    }
  }

  agregar(producto: Product) {
    this.itemsSignal.update(lista => {
      const existing = lista.find(item => item.product.id === producto.id);
      if (existing) {
        return lista.map(item =>
          item.product.id === producto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...lista, { product: producto, quantity: 1 }];
      }
    });
  }

  quitar(id: number) {
    // Quitar solo una unidad del producto con `id`. Si es 1, eliminarlo.
    this.itemsSignal.update(lista => {
      const existing = lista.find(item => item.product.id === id);
      if (!existing) return lista;

      if (existing.quantity > 1) {
        return lista.map(item =>
          item.product.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return lista.filter(item => item.product.id !== id);
      }
    });
  }

  vaciar() {
    this.itemsSignal.set([]);
  }

  total(): number {
    return this.itemsSignal().reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }

  exportarXML() {
    const items = this.itemsSignal();

    if (!items || items.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const subtotal = items.reduce((acc, item) => acc + ((item.product.price ?? 0) * item.quantity), 0);
    const impuestoTasa = 0.16; // IVA 16%
    const impuestos = +(subtotal * impuestoTasa);
    const total = +(subtotal + impuestos);

    const fmt = (n: number) => n.toFixed(2);
    const fecha = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<cfdi:Comprobante Version="4.0" Fecha="${fecha}" Sello="" FormaPago="01" NoCertificado="" Certificado="" SubTotal="${fmt(subtotal)}" Moneda="MXN" Total="${fmt(total)}" TipoDeComprobante="I" LugarExpedicion="00000" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd">\n`;
    xml += `  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="Mi Empresa SA de CV" RegimenFiscal="612"/>\n`;
    xml += `  <cfdi:Receptor Rfc="XAXX010101000" Nombre="Publico en General" UsoCFDI="G03"/>\n`;
    xml += `  <cfdi:Conceptos>\n`;
    for (const item of items) {
      const cantidad = item.quantity;
      const valorUnitario = item.product.price ?? 0;
      const importe = +(cantidad * valorUnitario);
      const descripcion = this.escapeXml(item.product.name + (item.product.description ? ' - ' + item.product.description : ''));
      xml += `    <cfdi:Concepto ClaveProdServ="43211506" NoIdentificacion="${item.product.id}" Cantidad="${cantidad}" ClaveUnidad="H87" Unidad="pieza" Descripcion="${descripcion}" ValorUnitario="${fmt(valorUnitario)}" Importe="${fmt(importe)}"/>\n`;
    }
    xml += `  </cfdi:Conceptos>\n`;
    xml += `  <cfdi:Impuestos TotalImpuestosTrasladados="${fmt(impuestos)}">\n`;
    xml += `    <cfdi:Traslados>\n`;
    xml += `      <cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="${impuestoTasa.toFixed(6)}" Importe="${fmt(impuestos)}"/>\n`;
    xml += `    </cfdi:Traslados>\n`;
    xml += `  </cfdi:Impuestos>\n`;
    xml += `</cfdi:Comprobante>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cfdi_4.0.xml';
    a.click();
    URL.revokeObjectURL(url);
  }

  generarReciboPago(paypalOrderId: string) {
    const items = this.itemsSignal();

    if (!items || items.length === 0) {
      console.warn('El carrito está vacío.');
      return;
    }

    const subtotal = items.reduce((acc, item) => acc + ((item.product.price ?? 0) * item.quantity), 0);
    const impuestoTasa = 0.16; // IVA 16%
    const impuestos = +(subtotal * impuestoTasa);
    const total = +(subtotal + impuestos);

    const fmt = (n: number) => n.toFixed(2);
    const fecha = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Recibo Fecha="${fecha}" OrdenPayPal="${paypalOrderId}" Moneda="MXN">\n`;
    xml += `  <Resumen>\n`;
    xml += `    <Subtotal>${fmt(subtotal)}</Subtotal>\n`;
    xml += `    <IVA>${fmt(impuestos)}</IVA>\n`;
    xml += `    <Total>${fmt(total)}</Total>\n`;
    xml += `  </Resumen>\n`;
    xml += `  <Detalles>\n`;

    for (const item of items) {
      const cantidad = item.quantity;
      const valorUnitario = item.product.price ?? 0;
      const importe = +(cantidad * valorUnitario);
      const descripcion = this.escapeXml(item.product.name + (item.product.description ? ' - ' + item.product.description : ''));

      xml += `    <Producto>\n`;
      xml += `      <Id>${item.product.id}</Id>\n`;
      xml += `      <Nombre>${descripcion}</Nombre>\n`;
      xml += `      <Cantidad>${cantidad}</Cantidad>\n`;
      xml += `      <Precio>${fmt(valorUnitario)}</Precio>\n`;
      xml += `      <Importe>${fmt(importe)}</Importe>\n`;
      xml += `    </Producto>\n`;
    }

    xml += `  </Detalles>\n`;
    xml += `  <Pago>\n`;
    xml += `    <Metodo>PayPal</Metodo>\n`;
    xml += `    <Estado>Completado</Estado>\n`;
    xml += `  </Pago>\n`;
    xml += `</Recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo_${paypalOrderId}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}

