import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

/**
 * Rutas que NO requieren autenticación (públicas)
 */
const publicPaths = [
  { url: '/api/auth/register', method: 'POST' },
  { url: '/api/auth/login', method: 'POST' },
  { url: '/health', method: 'GET' },
  { url: '/api/health', method: 'GET' },
];

/**
 * Verifica si una ruta es pública
 */
function isPublicPath(req: Request): boolean {
  return publicPaths.some((route) => route.url === req.path && route.method === req.method);
}

/**
 * Middleware de autenticación global
 */
function globalAuth(req: Request, res: Response, next: NextFunction): void {
  // Si es ruta pública, continuar sin verificar token
  if (isPublicPath(req)) {
    return next();
  }

  // Verificar que existe el header de autorización
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  // Extraer el token del header
  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  // Verificar y decodificar el token
  const secret: Secret = process.env.JWT_SECRET || 'default-secret';
  try {
    const decoded = jwt.verify(token, secret);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.user = decoded as any;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export default globalAuth;