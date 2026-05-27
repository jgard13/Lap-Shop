const jwt = require('jsonwebtoken');
const UsuarioService = require('../services/usuario.service');
const EmailService = require('../services/email.service');
const {
  createPaypalOrder,
  capturePaypalOrder
} = require('../services/paypal.service');

async function createOrder(req, res) {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({ error: 'El total es inválido' });
    }

    const order = await createPaypalOrder({ items, total });

    res.status(200).json({
      id: order.id,
      status: order.status
    });
  } catch (error) {
    console.error('Error en createOrder:', error.message || error);
    res.status(500).json({ error: 'No se pudo crear la orden', detalle: error.message || String(error) });
  }
}

async function captureOrder(req, res) {
  try {
    const { orderId, items } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es obligatorio' });
    }

    const captureData = await capturePaypalOrder(orderId);

    // Intentar extraer datos del usuario si está autenticado (JWT opcional)
    let userId = null;
    let userEmail = captureData.payer?.email_address || null;
    let userUsername = [captureData.payer?.name?.given_name, captureData.payer?.name?.surname].filter(Boolean).join(' ') || 'Cliente';

    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        try {
          const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
          userId = decoded.id;
          if (decoded.correo) userEmail = decoded.correo;
          if (decoded.usuario) userUsername = decoded.usuario;
        } catch (jwtError) {
          console.warn('Token JWT inválido o expirado en captura de PayPal, guardando como invitado:', jwtError.message);
        }
      }
    }

    // Si el pago es exitoso, procesar registro y envío de correos
    if (captureData.status === 'COMPLETED') {
      const total = captureData.purchase_units[0].payments.captures[0].amount.value || captureData.purchase_units[0].amount.value;
      
      // Usar los items de req.body o de PayPal
      let orderItems = items;
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        const paypalItems = captureData.purchase_units[0].items || [];
        orderItems = paypalItems.map(pi => ({
          id: null,
          name: pi.name,
          price: pi.unit_amount.value,
          cantidad: Number(pi.quantity || 1)
        }));
      }

      // Guardar pedido en PostgreSQL (si el usuario está autenticado)
      if (userId) {
        try {
          await UsuarioService.crearPedido(userId, orderId, total, orderItems);
          console.log(`✓ Pedido ${orderId} registrado exitosamente para el usuario ID ${userId}`);
        } catch (dbError) {
          console.error('Error al guardar el pedido en la base de datos:', dbError.message || dbError);
        }
      }

      // Enviar correo de confirmación de compra de forma asíncrona
      if (userEmail) {
        EmailService.enviarConfirmacionCompra(userEmail, orderId, total, orderItems, userUsername)
          .then(sent => {
            if (sent) {
              console.log(`✓ Correo de confirmación enviado exitosamente a: ${userEmail}`);
            }
          })
          .catch(emailError => {
            console.error('Error al enviar correo de confirmación:', emailError);
          });
      }
    }

    res.status(200).json(captureData);
  } catch (error) {
    console.error('Error en captureOrder:', error.message || error);
    res.status(500).json({ error: 'No se pudo capturar la orden', detalle: error.message || String(error) });
  }
}

module.exports = {
  createOrder,
  captureOrder
};
