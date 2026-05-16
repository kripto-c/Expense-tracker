import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response } from 'express';
import prisma from './prisma';
import app from './app';
import apiRouter from './routes/index';
import globalAuth from './middlewares/auth.global';
import contextMiddleware from './middlewares/context.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { registerServices } from './services';
import setProvider from './middlewares/setProvider.middleware';
import attachServices from './middlewares/attachServices.middleware';

// Middleware para parsear JSON en las peticiones
app.use(cors());
app.use(express.json());

// Middleware global de autenticación
// setProvider: asigna el proveedor de la petición (REST, etc.)
// globalAuth: verifica el token JWT y adjunta el usuario
// attachServices: inyecta los servicios en el request
// contextMiddleware: habilita getCurrentUser() en el contexto asíncrono
app.use(setProvider);
app.use(globalAuth);
app.use(attachServices);
app.use(contextMiddleware);

// Registrar todos los servicios de la aplicación
registerServices(app);

// Montar rutas de la API bajo el prefijo /api
app.use('/api', apiRouter);

// Endpoint de verificación de salud del servidor
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Middleware de manejo de errores
// Debe ser el último middleware registrado
app.use(errorHandler);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Desconectar Prisma cuando el proceso termine
// Asegura que no queden conexiones abiertas
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});