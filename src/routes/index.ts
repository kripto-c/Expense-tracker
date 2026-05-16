import { Router } from 'express';
import groupRoutes from './group.routes';
import authRoutes from './auth.routes';
import expenseRoutes from './expense.routes';
import rolesRoutes from './roles.routes';

const router = Router();

// Montar rutas bajo /api
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/roles', rolesRoutes);

// Ruta de health check
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default router;