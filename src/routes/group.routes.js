const express = require('express')
const router = express.Router()
const { create, patch, remove, find, get } = require('../controllers/group.controller')

router.get('/', find)
router.get('/:id', get)
router.post('/', create)
router.patch('/:id', patch)
router.delete('/:id', remove)

module.exports = router
