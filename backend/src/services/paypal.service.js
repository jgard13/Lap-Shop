const paypalConfig = require('../config/paypal.config');

function getBasicAuth() {
  return Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
}

async function getAccessToken() {
  const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${getBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function createPaypalOrder(orderData) {
  const accessToken = await getAccessToken();

  const processedItems = orderData.items.map(item => {
    const product = item.product || item;
    const qty = Number(item.quantity || item.cantidad || 1);
    const unitPrice = Number(product.precio || product.price || 0).toFixed(2);
    const name = String(product.nombre || product.name || 'Item').substring(0, 127);
    return {
      name,
      quantity: String(qty),
      unit_amount: {
        currency_code: 'MXN',
        value: unitPrice
      }
    };
  });

  const calculatedTotal = processedItems.reduce((acc, item) => acc + (Number(item.unit_amount.value) * Number(item.quantity)), 0).toFixed(2);

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'MXN',
          value: calculatedTotal,
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: calculatedTotal
            }
          }
        },
        items: processedItems
      }
    ]
  };

  const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error creando orden PayPal: ${JSON.stringify(data)}`);
  }

  return data;
}

async function capturePaypalOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error capturando orden PayPal: ${JSON.stringify(data)}`);
  }

  return data;
}

module.exports = {
  getAccessToken,
  createPaypalOrder,
  capturePaypalOrder
};
