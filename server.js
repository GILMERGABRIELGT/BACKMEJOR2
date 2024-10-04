const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./Usuarios/userRoutes');
const productRoutes = require('./Productos/productRoutes');
const orderRoutes = require('./Pedidos/orderRoutes');
const pagosRoutes = require('./Pagos/pagosRoutes')
const { poolPromise } = require('./db');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000; // Usa la variable de entorno PORT

app.use(bodyParser.json());

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.get('/c', (req, res) => {
  res.send("Hola, este es tu back");
});

app.get('/get/test/db', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Usuarios');
    res.json({ count: result.recordset[0].count });
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/', orderRoutes);
app.use('/api/tarjetas', pagosRoutes)

app.use((req, res, next) => {
  res.status(404).send("Página no encontrada");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Middleware para capturar errores
app.use((err, req, res, next) => {
  console.error(err.stack);  // Esto imprime el error en la consola
  res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
