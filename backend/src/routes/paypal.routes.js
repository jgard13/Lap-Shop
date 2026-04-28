const { Router } = require('express');
const { createOrder, captureOrder } = require('../controllers/paypal.controller');

const enrutador = Router();

enrutador.post('/create-order', createOrder);
enrutador.post('/capture-order', captureOrder);

module.exports = enrutador;
