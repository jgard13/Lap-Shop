const { createPaypalOrder, capturePaypalOrder } = require('../services/paypal.service');

const createOrder = async (req, res) => {
  try {
    const { items: cartItems, total: finalAmount } = req.body;

    if (!cartItems?.length) return res.status(400).json({ error: 'El carrito está vacío' });
    if (!finalAmount || parseFloat(finalAmount) <= 0) return res.status(400).json({ error: 'El total es inválido' });

    const paypalResponse = await createPaypalOrder({ items: cartItems, total: finalAmount });

    return res.status(200).json({ id: paypalResponse.id, status: paypalResponse.status });
  } catch (err) {
    console.error('Fallo en createOrder:', err);
    return res.status(500).json({ error: 'No se pudo crear la orden', detalle: err.message || String(err) });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { orderId: id } = req.body;
    if (!id) return res.status(400).json({ error: 'orderId es obligatorio' });

    const result = await capturePaypalOrder(id);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Fallo en captureOrder:', err);
    return res.status(500).json({ error: 'No se pudo capturar la orden', detalle: err.message || String(err) });
  }
};

module.exports = { createOrder, captureOrder };
