const nodemailer = require('nodemailer');

class EmailService {
  static async enviarCodigoVerificacion(correo, codigo) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Log the verification code to console regardless for easy testing/debugging
    console.log('\n=============================================');
    console.log(`[MOCK EMAIL] Para: ${correo}`);
    console.log(`Codigo de verificacion de contrasena: ${codigo}`);
    console.log('=============================================\n');

    if (!user || !pass) {
      console.log('EMAIL_USER o EMAIL_PASS no estan configurados en el archivo .env. Usando fallback de consola.');
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"LapCompare Soporte" <${user}>`,
        to: correo,
        subject: 'Código de verificación de restablecimiento de contraseña - LapCompare',
        text: `Tu código de verificación para restablecer tu contraseña es: ${codigo}. Este código expirará en 15 minutos.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2b3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Restablecer tu contraseña</h2>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este correo electrónico.</p>
            <div style="background-color: #f7f9fa; border: 1px dashed #3498db; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2c3e50;">${codigo}</span>
            </div>
            <p style="font-size: 14px; color: #7f8c8d;">Este código de verificación es válido por 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #bdc3c7; text-align: center;">LapCompare © 2026 - Herramienta de Comparación de Laptops</p>
          </div>
        `,
      });

      console.log('Correo de verificacion enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      // We don't fail the request completely if the email server fails but log is printed.
      // However, if the user intended to send it, they should know it failed.
      throw new Error('No se pudo enviar el correo de verificación. Por favor intenta más tarde.');
    }
  }

  static async enviarConfirmacionCompra(correo, orderId, total, items, usuarioNombre = 'Cliente') {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    const processedItems = items.map(item => {
      const product = item.product || item;
      const name = product.nombre || product.name || 'Laptop';
      const precio = Number(product.precio || product.price || 0);
      const cantidad = Number(item.quantity || item.cantidad || 1);
      return { name, precio, cantidad };
    });

    const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
    const itemRows = processedItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${fmt(item.precio)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #7E57C2;">${fmt(item.precio * item.cantidad)}</td>
      </tr>
    `).join('');

    console.log('\n=============================================');
    console.log(`[MOCK EMAIL] Para: ${correo}`);
    console.log(`Confirmación de compra - Orden: ${orderId}`);
    console.log(`Total: ${fmt(total)}`);
    console.log('=============================================\n');

    if (!user || !pass) {
      console.log('EMAIL_USER o EMAIL_PASS no estan configurados en el archivo .env. Usando fallback de consola.');
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const cfdiXml = EmailService.generarCfdiXml(orderId, total, items);

      const ticketHtml = EmailService.generarTicketHtml(orderId, total, items, usuarioNombre);

      const info = await transporter.sendMail({
        from: `"LapCompare Shop" <${user}>`,
        to: correo,
        subject: `Confirmación de tu compra en LapCompare - Orden ${orderId}`,
        text: `¡Gracias por tu compra, ${usuarioNombre}! Tu pedido con ID ${orderId} ha sido procesado por un total de ${fmt(total)}.`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
            <div style="text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
              <h1 style="color: #7E57C2; margin: 0; font-size: 26px; font-weight: 800;">¡Gracias por tu compra!</h1>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Orden de Compra: <span style="font-family: monospace; font-weight: bold; color: #111827;">${orderId}</span></p>
            </div>
            
            <p>Hola, <strong>${usuarioNombre}</strong>.</p>
            <p>Tu pago ha sido procesado de manera correcta a través de PayPal y tu compra ha sido confirmada con éxito. A continuación te presentamos el resumen detallado de tu pedido:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px 10px; text-align: left; font-weight: 700; color: #374151;">Producto</th>
                  <th style="padding: 12px 10px; text-align: center; font-weight: 700; color: #374151;">Cant.</th>
                  <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #374151;">P. Unitario</th>
                  <th style="padding: 12px 10px; text-align: right; font-weight: 700; color: #374151;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #4b5563;">
                <span>Subtotal (sin IVA):</span>
                <span style="font-weight: bold;">${fmt(total / 1.16)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #4b5563;">
                <span>IVA (16%):</span>
                <span style="font-weight: bold;">${fmt((total / 1.16) * 0.16)}</span>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111827;">
                <span>Total pagado:</span>
                <span style="color: #7E57C2;">${fmt(total)}</span>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #7E57C2; padding: 15px; border-radius: 0 8px 8px 0; margin-top: 25px; font-size: 13px; color: #4b5563;">
              <p style="margin: 0; font-weight: 600; color: #111827; margin-bottom: 4px;">Información de Facturación:</p>
              <p style="margin: 0;">Se adjuntó tu comprobante XML de facturación simplificada generado automáticamente. También encontrarás adjunto el ticket de compra con formato de impresora térmica para tu control personal.</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">LapCompare Shop © 2026 - Herramienta de Comparación de Laptops</p>
          </div>
        `,
        attachments: [
          {
            filename: `factura_cfdi_${orderId}.xml`,
            content: cfdiXml,
            contentType: 'application/xml'
          },
          {
            filename: `ticket_compra_${orderId}.html`,
            content: ticketHtml,
            contentType: 'text/html'
          }
        ]
      });

      console.log('Correo de confirmacion de compra enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar correo de confirmacion:', error);
      return false;
    }
  }

  static generarCfdiXml(orderId, total, items) {
    const subtotal = total / 1.16;
    const impuestos = total - subtotal;
    const fecha = new Date().toISOString();
    
    const fmt = (n) => Number(n).toFixed(2);
    
    const escapeXml = (value) => {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<cfdi:Comprobante Version="4.0" Fecha="${fecha}" Sello="" FormaPago="01" NoCertificado="" Certificado="" SubTotal="${fmt(subtotal)}" Moneda="MXN" Total="${fmt(total)}" TipoDeComprobante="I" LugarExpedicion="00000" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd">\n`;
    xml += `  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="Mi Empresa SA de CV" RegimenFiscal="612"/>\n`;
    xml += `  <cfdi:Receptor Rfc="XAXX010101000" Nombre="Publico en General" UsoCFDI="G03"/>\n`;
    xml += `  <cfdi:Conceptos>\n`;
    
    for (const item of items) {
      const product = item.product || item;
      const qty = Number(item.quantity || item.cantidad || 1);
      const valorUnitario = Number(product.precio || product.price || 0);
      const importe = qty * valorUnitario;
      const descripcion = escapeXml((product.nombre || product.name || 'Laptop') + (product.descripcion || product.description ? ' - ' + (product.descripcion || product.description) : ''));
      xml += `    <cfdi:Concepto ClaveProdServ="43211506" NoIdentificacion="${product.id || 'N/A'}" Cantidad="${qty}" ClaveUnidad="H87" Unidad="pieza" Descripcion="${descripcion}" ValorUnitario="${fmt(valorUnitario)}" Importe="${fmt(importe)}"/>\n`;
    }
    
    xml += `  </cfdi:Conceptos>\n`;
    xml += `  <cfdi:Impuestos TotalImpuestosTrasladados="${fmt(impuestos)}">\n`;
    xml += `    <cfdi:Traslados>\n`;
    xml += `      <cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${fmt(impuestos)}"/>\n`;
    xml += `    </cfdi:Traslados>\n`;
    xml += `  </cfdi:Impuestos>\n`;
    xml += `</cfdi:Comprobante>`;
    
    return xml;
  }

  static generarTicketHtml(orderId, total, items, usuarioNombre = 'Cliente') {
    const subtotal = total / 1.16;
    const impuestos = total - subtotal;
    const fecha = new Date();
    const fechaStr = `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    
    const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
    
    const processedItems = items.map(item => {
      const product = item.product || item;
      const name = product.nombre || product.name || 'Laptop';
      const precio = Number(product.precio || product.price || 0);
      const cantidad = Number(item.quantity || item.cantidad || 1);
      return { name, precio, cantidad };
    });

    const itemsRows = processedItems.map(item => `
      <div class="items-row">
        <div class="item-main-line">
          <span class="col-qty">${item.cantidad}</span>
          <span class="col-desc">${item.name}</span>
          <span class="col-total">${fmt(item.precio * item.cantidad)}</span>
        </div>
        <div class="item-sub-line">
          <span class="col-detail">Unitario: ${fmt(item.precio)}</span>
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ticket de Compra - ${orderId}</title>
<style>
body {
  background-color: #f3f4f6;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
}
.thermal-receipt {
  background: #fafafa;
  color: #111111;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  padding: 28px 22px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-left: 1px dashed #ccc;
  border-right: 1px dashed #ccc;
  width: 100%;
  max-width: 360px;
  box-sizing: border-box;
  position: relative;
}
.zigzag-edge-top {
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 8px;
  background: linear-gradient(-45deg, transparent 4px, #fafafa 4px), linear-gradient(45deg, transparent 4px, #fafafa 4px);
  background-size: 8px 8px;
}
.zigzag-edge-bottom {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 8px;
  background: linear-gradient(-135deg, transparent 4px, #fafafa 4px), linear-gradient(135deg, transparent 4px, #fafafa 4px);
  background-size: 8px 8px;
}
.receipt-header { text-align: center; }
.receipt-brand { font-size: 1.45rem; font-weight: 900; margin: 0; letter-spacing: 2px; color: #000; }
.receipt-subtitle { font-size: 0.75rem; margin: 2px 0; text-transform: uppercase; }
.receipt-info-text { font-size: 0.7rem; margin: 6px 0 0 0; color: #444; line-height: 1.35; }
.receipt-divider { border-top: 1px dashed #444; margin: 8px 0; }
.receipt-meta { font-size: 0.75rem; line-height: 1.4; }
.meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.meta-val { word-break: break-all; max-width: 70%; text-align: right; }
.badge-estado-thermal { background-color: #111; color: #fff; padding: 1px 6px; font-size: 0.68rem; border-radius: 2px; }
.receipt-items-table { display: flex; flex-direction: column; gap: 6px; }
.items-header { display: flex; font-size: 0.72rem; border-bottom: 1px dashed #444; padding-bottom: 4px; font-weight: bold; }
.items-body { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.items-row { display: flex; flex-direction: column; font-size: 0.72rem; }
.item-main-line { display: flex; justify-content: space-between; }
.item-sub-line { font-size: 0.68rem; color: #444; padding-left: 25px; margin-top: 2px; }
.col-qty { width: 25px; flex-shrink: 0; }
.col-desc { flex-grow: 1; padding-right: 10px; text-align: left; }
.col-total { text-align: right; flex-shrink: 0; }
.receipt-totals { font-size: 0.75rem; line-height: 1.4; }
.grand-total { font-size: 0.95rem; font-weight: 900; border-top: 1px dashed #444; padding-top: 6px; color: #000; }
.receipt-footer { text-align: center; font-size: 0.72rem; margin-top: 8px; }
.barcode-lines { height: 38px; width: 170px; background: repeating-linear-gradient(90deg, #111, #111 2px, transparent 2px, transparent 5px, #111 5px, #111 7px, transparent 7px, transparent 9px, #111 9px, #111 10px, transparent 10px, transparent 12px); margin: 10px auto 4px auto; }
.barcode-number { font-size: 0.62rem; letter-spacing: 2px; }
</style>
</head>
<body>
<div class="thermal-receipt">
  <div class="zigzag-edge-top"></div>
  <div class="receipt-header">
    <h2 class="receipt-brand">LAPCOMPARE</h2>
    <p class="receipt-subtitle">Venta de Tecnología y Laptops</p>
    <p class="receipt-info-text">RFC: AAA010101AAA<br>Av. Universidad 1000, CDMX</p>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-meta">
    <div class="meta-row"><span>FECHA:</span><span class="meta-val">${fechaStr}</span></div>
    <div class="meta-row"><span>CLIENTE:</span><span class="meta-val">${usuarioNombre}</span></div>
    <div class="meta-row"><span>PEDIDO ID:</span><span class="meta-val">${orderId}</span></div>
    <div class="meta-row"><span>ESTADO:</span><span><span class="badge-estado-thermal">PAGADO</span></span></div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-items-table">
    <div class="items-header"><span class="col-qty">CANT</span><span class="col-desc">DESCRIPCIÓN</span><span class="col-total">TOTAL</span></div>
    <div class="items-body">${itemsRows}</div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-totals">
    <div class="total-row"><span>SUBTOTAL:</span><span>${fmt(subtotal)}</span></div>
    <div class="total-row"><span>IVA (16%):</span><span>${fmt(impuestos)}</span></div>
    <div class="total-row grand-total"><span>TOTAL MXN:</span><span>${fmt(total)}</span></div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-footer">
    <p style="margin:0;font-weight:bold;">MÉTODO DE PAGO: PAYPAL</p>
    <p style="margin:4px 0 0 0;font-weight:900;letter-spacing:1.5px;">¡GRACIAS POR TU COMPRA!</p>
    <div class="barcode-lines"></div>
    <span class="barcode-number">${orderId.substring(0, 16)}</span>
  </div>
  <div class="zigzag-edge-bottom"></div>
</div>
</body>
</html>`;
  }
}

module.exports = EmailService;
