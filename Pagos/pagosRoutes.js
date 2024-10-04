const { authenticateJWT, authorizeAdmin } = require('../authMiddleware');
const express = require('express');
const { getAllCards, addCard, updateCard, deleteCard, getCardByUser } = require('./pagosController');

const router = express.Router();

// Rutas que requieren autenticación
router.get('/', authenticateJWT, getAllCards);  // Obtener todas las tarjetas (autenticado)
router.post('/', authenticateJWT, addCard);  // Agregar una tarjeta (autenticado)

// Rutas que requieren autenticación y ser administrador
router.put('/:id', authenticateJWT, authorizeAdmin, updateCard);  // Actualizar tarjeta (solo admin)
router.delete('/:id', authenticateJWT, authorizeAdmin, deleteCard);  // Eliminar tarjeta (solo admin)

// Ruta para obtener la tarjeta de un usuario autenticado
router.get('/user', authenticateJWT, getCardByUser);  // Obtener tarjeta del usuario autenticado

module.exports = router;
