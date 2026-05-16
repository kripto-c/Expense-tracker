import { Router } from 'express';
import { create, patch, remove, find, get } from '../controllers/roles.controller';

const router = Router();

// Rutas CRUD de roles
router.get('/', find);
router.get('/:id', get);
router.post('/', create);
router.patch('/:id', patch);
router.delete('/:id', remove);

export default router;