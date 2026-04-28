const config = require('../config/paypal.config');

const generateAuthToken = async () => {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  
  const req = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const res = await req.json();
  if (!req.ok) throw new Error(`Fallo obteniendo token: ${JSON.stringify(res)}`);
  return res.access_token;
};

const createPaypalOrder = async (cartData) => {
  const token = await generateAuthToken();
  let totalCalculado = 0;

  const productosFormateados = cartData.items.map(prod => {
    const precioUnitario = Number(prod.precio || prod.price || 0);
    totalCalculado += precioUnitario;
    
    return {
      name: (prod.nombre || prod.name || 'Articulo').substring(0, 127),
      quantity: '1',
      unit_amount: { currency_code: 'MXN', value: precioUnitario.toFixed(2) }
    };
  });

  const montoFinal = totalCalculado.toFixed(2);
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'MXN',
        value: montoFinal,
        breakdown: { item_total: { currency_code: 'MXN', value: montoFinal } }
      },
      items: productosFormateados
    }]
  };

  const req = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const res = await req.json();
  if (!req.ok) throw new Error(`Fallo al crear orden PayPal: ${JSON.stringify(res)}`);
  return res;
};

const capturePaypalOrder = async (idOrden) => {
  const token = await generateAuthToken();

  const req = await fetch(`${config.baseUrl}/v2/checkout/orders/${idOrden}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const res = await req.json();
  if (!req.ok) throw new Error(`Fallo al capturar pago PayPal: ${JSON.stringify(res)}`);
  return res;
};

module.exports = {
  getAccessToken: generateAuthToken, 
  createPaypalOrder,
  capturePaypalOrder
};
