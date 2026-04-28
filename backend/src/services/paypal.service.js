const paypalClient = require('./paypal.client');

function normalizeItem(item) {
  const quantity = Number(item.cantidad || item.quantity || 1);
  const unitPrice = Number(item.precio || item.price || 0);
  return {
    name: String(item.nombre || item.name || 'Producto').substring(0, 127),
    quantity: String(quantity > 0 ? quantity : 1),
    unit_amount: {
      currency_code: 'MXN',
      value: unitPrice.toFixed(2)
    }
  };
}

function buildPurchaseUnits(items) {
  const normalizedItems = items.map(normalizeItem);
  const itemTotal = normalizedItems.reduce((sum, item) => {
    return sum + Number(item.unit_amount.value) * Number(item.quantity);
  }, 0);

  const total = itemTotal.toFixed(2);

  return {
    purchase_units: [
      {
        amount: {
          currency_code: 'MXN',
          value: total,
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: total
            }
          }
        },
        items: normalizedItems
      }
    ]
  };
}

function validateOrderPayload(orderData) {
  if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('El carrito está vacío o la información de items no es válida');
  }

  const totalSent = Number(orderData.total);
  if (Number.isNaN(totalSent) || totalSent <= 0) {
    throw new Error('El total es inválido');
  }
}

async function createPaypalOrder(orderData) {
  validateOrderPayload(orderData);

  const body = {
    intent: 'CAPTURE',
    ...buildPurchaseUnits(orderData.items)
  };

  const response = await paypalClient.request('/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return {
    id: response.id,
    status: response.status,
    links: response.links
  };
}

async function capturePaypalOrder(orderId) {
  if (!orderId) {
    throw new Error('orderId es obligatorio');
  }

  const response = await paypalClient.request(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response;
}

module.exports = {
  createPaypalOrder,
  capturePaypalOrder
};
