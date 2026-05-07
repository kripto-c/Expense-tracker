const express = require('express')
const router = express.Router()
const { create, patch, remove, find, get } = require('../controllers/group.controller')
const { addMember, getMembers } = require('../controllers/groupMember.controller')

router.get('/', find)
router.get('/:id', get)
router.post('/', create)
router.patch('/:id', patch)
router.delete('/:id', remove)

// Rutas para miembros
router.post('/:groupId/members', addMember)
router.get('/:groupId/members', getMembers)

module.exports = router
