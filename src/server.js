require('dotenv').config()
const express = require('express')
const cors = require('cors')
const prisma = require('./prisma')
const app = require('./app')
const groupRoutes = require('./routes/group.routes')
const authRoutes = require('./routes/auth.routes')
const apiRouter = require('./routes/index')
const globalAuth = require('./middlewares/auth.global')
const contextMiddleware = require('./middlewares/context.middleware')
const { errorHandler } = require('./middlewares/error.middleware')
const { registerServices } = require('./services')
const setProvider = require('./middlewares/setProvider.middleware')

app.use(cors())
app.use(express.json())

// Middleware global de autenticación
app.use(setProvider)
app.use(globalAuth)
app.use(contextMiddleware) // a partir de aquí, dentro de la misma petición, getCurrentUser() devolverá el usuario

//Servicios
registerServices(app)

// Rutas
app.use('/api', apiRouter)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Middleware de manejo de errores
app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
