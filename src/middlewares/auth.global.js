const jwt = require('jsonwebtoken')

// Rutas que NO requieren autenticación (públicas)
const publicPaths = [
  { url: '/api/auth/register', method: 'POST' },
  { url: '/api/auth/login', method: 'POST' },
  { url: '/health', method: 'GET' },
  // Si tienes otras rutas públicas, agrégalas aquí
]

function isPublicPath(req) {
  return publicPaths.some((route) => route.url === req.path && route.method === req.method)
}

function globalAuth(req, res, next) {
  if (isPublicPath(req)) {
    return next() // Pública, no necesita token
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = globalAuth
