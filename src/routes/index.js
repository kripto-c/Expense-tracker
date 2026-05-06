const express = require('express')
const router = express.Router()

const groupRoutes = require('./group.routes')
const authRoutes = require('./auth.routes')
const expenseRoutes = require('./expense.routes')
const rolesRoutes = require('./roles.routes')

// Montar rutas
router.use('/auth', authRoutes)
router.use('/groups', groupRoutes)
router.use('/expenses', expenseRoutes)
router.use('/roles', rolesRoutes)

// Ruta de health check (opcional acá también)
router.get('/health', (req, res) => res.json({ status: 'ok' }))

module.exports = router
