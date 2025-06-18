const { Router } = require('express');
const { login, register, renewToken, verifyToken, changePassword, requestPasswordReset } = require('../controllers/auth');
const { verifyJWT } = require('../middleware/verifyJWT');

const router = Router();

//  Rutas de autenticación
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', requestPasswordReset);
router.get('/renew', verifyJWT, renewToken);
router.get('/verify', verifyJWT, verifyToken);
router.put('/change-password', verifyJWT, changePassword);

console.log(' Rutas de auth configuradas:', {
    'POST /login': 'login',
    'POST /register': 'register',
    'GET /verify': 'verifyToken',
    'PUT /change-password': 'changePassword'
});

module.exports = router;