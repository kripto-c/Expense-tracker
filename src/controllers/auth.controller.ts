import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { NotAuthenticated, BadRequest, Conflict } from '../errors'

/**
 * Tiempo de expiración del token JWT
 */
const EXPIRES_IN = process.env.EXPIRES_IN || '7d'

/**
 * Controlador de autenticación
 * Maneja el registro y login de usuarios
 */

/**
 * Registro de nuevo usuario
 * Valida que el email no exista y crea el usuario con rol por defecto
 */
export const register = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new BadRequest('Email y password requeridos'))
  }

  const userService = req.services.user

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userService
    .findByEmail(email as string)
    .then((existing: any) => {
      if (existing) {
        throw new Conflict('Email ya registrado')
      }
      return userService.create({ email, password }, { provider: req.provider })
    })
    .then((user: any) => {
      const { password: _, ...userWithoutPassword } = user
      res.status(201).json(userWithoutPassword)
    })
    .catch(next)
}

/**
 * Login de usuario
 * Verifica credenciales y retorna token JWT con roles
 */
export const login = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new BadRequest('Email y password requeridos'))
  }

  const userService = req.services.user

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userService
    .findByEmail(email as string)
    .then((user: any) => {
      if (!user) {
        throw new NotAuthenticated('Credenciales inválidas')
      }
      return bcrypt
        .compare(password as string, user.password)
        .then((valid: boolean) => {
          if (!valid) throw new NotAuthenticated('Credenciales inválidas')
          return userService.getRoles(user.id)
        })
        .then((roles: any) => {
          const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'default-secret', {
            expiresIn: EXPIRES_IN,
          } as jwt.SignOptions)
          res.json({ accessToken: token, user: { id: user.id, email: user.email, roles } })
        })
    })
    .catch(next)
}
