const jwt = require('jsonwebtoken');

// Middleware para autenticar usando JWT
const authenticateJWT = (req, res, next) => {
    // Obtener el token del header 'Authorization'
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verificar el token usando la clave secreta desde las variables de entorno
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Añadir la información decodificada del token al objeto req
        next();  // Pasar al siguiente middleware
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Middleware para verificar que el usuario sea admin
const authorizeAdmin = (req, res, next) => {
    if (req.user.rolID !== 2) {  // Verificar si el rol del usuario es de administrador
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();  // Pasar al siguiente middleware si es admin
};

module.exports = {
    authenticateJWT,
    authorizeAdmin
};
