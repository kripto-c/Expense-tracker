import { Router } from 'express';
import { create, patch, remove, find, get } from '../controllers/group.controller';
import { addMember, getMembers } from '../controllers/groupMember.controller';

const router = Router();

// Rutas CRUD de grupos
router.get('/', find);
router.get('/:id', get);
router.post('/', create);
router.patch('/:id', patch);
router.delete('/:id', remove);

// Rutas para miembros
router.post('/:groupId/members', addMember);
router.get('/:groupId/members', getMembers);

export default router;