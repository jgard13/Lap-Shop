const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const paypalRoutes = require('./routes/paypal.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', productosRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api', usuarioRoutes);

module.exports = app;
