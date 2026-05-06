const express = require('express')
const router = express.Router()
const { create, patch, remove, find, get } = require('../controllers/roles.controller')
const { checkPermission } = require('../hooks/permissions')

router.get('/', find)
router.get('/:id', get)
router.post('/', create)
router.patch('/:id', patch)
router.delete('/:id', remove)

module.exports = router
