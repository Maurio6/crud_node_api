const express = require('express');
const router = express.Router();
const { register, login, getMe, getMyPermissions } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/me', protect, getMe);
router.get('/permissions', protect, getMyPermissions);

module.exports = router;
