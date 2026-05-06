const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { NotAuthenticated, BadRequest, Conflict } = require('../errors')

exports.register = async (req, res, next) => {
  try {
    const userService = req.app.getService('user')
    const { email, password } = req.body
    if (!email || !password) {
      return next(new BadRequest('Email y password requeridos'))
    }
    const existing = await userService.findByEmail(email)
    if (existing) {
      return next(new Conflict('Email ya registrado'))
    }
    const user = await userService.create({ email, password })
    // No devolver el password
    const { password: _, ...userWithoutPassword } = user
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const userService = req.app.getService('user')
    const { email, password } = req.body
    if (!email || !password) {
      return next(new BadRequest('Email y password requeridos'))
    }
    const user = await userService.findByEmail(email)
    if (!user) {
      return next(new NotAuthenticated('Credenciales inválidas'))
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return next(new NotAuthenticated('Credenciales inválidas'))
    }

    const roles = await userService.getRoles(user.id)

    const token = jwt.sign({ userId: user.id, email: user.email, roles }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ accessToken: token, user: { id: user.id, email: user.email, roles } })
  } catch (error) {
    next(error)
  }
}
