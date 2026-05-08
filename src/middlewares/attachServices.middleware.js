// src/middlewares/attachServices.js
const app = require('../app')

function attachServices(req, res, next) {
  const baseParams = { provider: req.provider, user: req.user }
  req.services = {}

  for (const [name, service] of app.services.entries()) {
    req.services[name] = new Proxy(service, {
      get(target, prop) {
        const originalMethod = target[prop]
        if (typeof originalMethod !== 'function') return originalMethod

        return function (...args) {
          // Para create y patch: firma (data, params)
          if (prop === 'create' || prop === 'patch') {
            let params = baseParams
            if (args.length > 1 && typeof args[1] === 'object') {
              params = { ...args[1], ...baseParams }
            }
            return originalMethod.call(target, args[0], params)
          }

          // Para find: firma (params) → un solo argumento
          if (prop === 'find') {
            const mergedParams = { ...(args[0] || {}), ...baseParams }
            return originalMethod.call(target, mergedParams)
          }

          // Para get y remove: firma (id, params)
          if (prop === 'get' || prop === 'remove') {
            let params = baseParams
            if (args.length > 1 && typeof args[1] === 'object') {
              params = { ...args[1], ...baseParams }
            }
            return originalMethod.call(target, args[0], params)
          }

          // Para otros métodos (si los hay) por defecto
          return originalMethod.call(target, ...args)
        }
      },
    })
  }
  next()
}

module.exports = attachServices
