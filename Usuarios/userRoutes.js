// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, getCustomers } = require('./userController');
const { authenticateJWT, authorizeAdmin } = require('../authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateJWT, getUserProfile);
router.get('/customers', authenticateJWT, authorizeAdmin, getCustomers);

router.get('/admin', authenticateJWT, authorizeAdmin, (req, res) => {
    res.json({ message: 'Welcome to the admin panel' });
});

module.exports = router;
