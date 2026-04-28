import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  // Lista reactiva del carrito
  private productosSignal = signal<Product[]>([]);

  // Exponer como readonly
  productos = this.productosSignal.asReadonly();

  // Señal computada con la cantidad de productos
  cantidad = computed(() => this.productosSignal().length);

  agregar(producto: Product) {
    this.productosSignal.update(lista => [...lista, producto]);
  }

  quitar(id: number) {
    // Quitar solo una unidad del producto con `id`.
    this.productosSignal.update(lista => {
      const idx = lista.findIndex(p => p.id === id);
      if (idx === -1) return lista;
      // crear nueva lista con el elemento en idx removido
      return [...lista.slice(0, idx), ...lista.slice(idx + 1)];
    });
  }

  vaciar() {
    this.productosSignal.set([]);
  }

  total(): number {
    return this.productosSignal().reduce((acc, p) => acc + p.price, 0);
  }

  exportarXML() {
    const productos = this.productosSignal();

    if (!productos || productos.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const subtotal = productos.reduce((acc, p) => acc + (p.price ?? 0), 0);
    const impuestoTasa = 0.16; // IVA 16%
    const impuestos = +(subtotal * impuestoTasa);
    const total = +(subtotal + impuestos);

    const fmt = (n: number) => n.toFixed(2);

    const fecha = new Date().toISOString();

    // Comprobante CFDI 4.0 (skeleton). NOTA: Este XML es una estructura básica y no está sellado ni timbrado.
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<cfdi:Comprobante Version="4.0" Fecha="${fecha}" Sello="" FormaPago="01" NoCertificado="" Certificado="" SubTotal="${fmt(subtotal)}" Moneda="MXN" Total="${fmt(total)}" TipoDeComprobante="I" LugarExpedicion="00000" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd">\n`;

    // Emisor (placeholder values)
    xml += `  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="Mi Empresa SA de CV" RegimenFiscal="612"/>\n`;

    // Receptor (placeholder values)
    xml += `  <cfdi:Receptor Rfc="XAXX010101000" Nombre="Publico en General" UsoCFDI="G03"/>\n`;

    // Conceptos
    xml += `  <cfdi:Conceptos>\n`;
    for (const p of productos) {
      const cantidad = 1;
      const valorUnitario = p.price ?? 0;
      const importe = +(cantidad * valorUnitario);
      const descripcion = this.escapeXml(p.name + (p.description ? ' - ' + p.description : ''));

      // Claves genéricas: ClaveProdServ y ClaveUnidad pueden ajustarse según catálogo SAT
      xml += `    <cfdi:Concepto ClaveProdServ="43211506" NoIdentificacion="${p.id}" Cantidad="${cantidad}" ClaveUnidad="H87" Unidad="pieza" Descripcion="${descripcion}" ValorUnitario="${fmt(valorUnitario)}" Importe="${fmt(importe)}"/>\n`;
    }
    xml += `  </cfdi:Conceptos>\n`;

    // Impuestos (traslados)
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
    const productos = this.productosSignal();

    if (!productos || productos.length === 0) {
      console.warn('El carrito está vacío.');
      return;
    }

    const subtotal = productos.reduce((acc, p) => acc + (p.price ?? 0), 0);
    const impuestoTasa = 0.16; // IVA 16%
    const impuestos = +(subtotal * impuestoTasa);
    const total = +(subtotal + impuestos);

    const fmt = (n: number) => n.toFixed(2);

    const fecha = new Date().toISOString();

    // Recibo con información de PayPal (formato XML simplificado)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Recibo Fecha="${fecha}" OrdenPayPal="${paypalOrderId}" Moneda="MXN">\n`;
    xml += `  <Resumen>\n`;
    xml += `    <Subtotal>${fmt(subtotal)}</Subtotal>\n`;
    xml += `    <IVA>${fmt(impuestos)}</IVA>\n`;
    xml += `    <Total>${fmt(total)}</Total>\n`;
    xml += `  </Resumen>\n`;
    xml += `  <Detalles>\n`;

    for (const p of productos) {
      const cantidad = 1;
      const valorUnitario = p.price ?? 0;
      const importe = +(cantidad * valorUnitario);
      const descripcion = this.escapeXml(p.name + (p.description ? ' - ' + p.description : ''));

      xml += `    <Producto>\n`;
      xml += `      <Id>${p.id}</Id>\n`;
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

