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
              <p style="margin: 0;">Se adjuntó tu comprobante XML de facturación simplificada generado automáticamente. Si deseas cambiar tus datos de facturación, puedes acceder a tu perfil de usuario en nuestra plataforma.</p>
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
}

module.exports = EmailService;
