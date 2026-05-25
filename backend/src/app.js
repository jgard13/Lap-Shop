const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const paypalRoutes = require('./routes/paypal.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const inventarioRoutes = require('./routes/inventario.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', productosRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/inventario', inventarioRoutes);

module.exports = app;
