// src/middlewares/attachServices.js
const app = require('../app')

function attachServices(req, res, next) {
  const baseParams = { provider: req.provider, user: req.user }
  req.services = {}

  for (const [name, service] of app.services.entries()) {
    req.services[name] = new Proxy(service, {
      get(target, prop) {
        const originalMethod = target[prop]
        if (typeof originalMethod === 'function') {
          return function (...args) {
            // Para métodos que esperan (data, params):
            if (prop === 'create' || prop === 'patch') {
              // args[0] es data, args[1] podría ser params si se pasa
              let params = baseParams
              if (args.length > 1 && typeof args[1] === 'object') {
                params = { ...args[1], ...baseParams }
              }
              return originalMethod.call(target, args[0], params)
            }
            // Para find, get, remove: el primer argumento es id o query, el segundo son params
            let params = baseParams
            if (args.length > 1 && typeof args[1] === 'object') {
              params = { ...args[1], ...baseParams }
            }
            return originalMethod.call(target, ...args, params)
          }
        }
        return originalMethod
      },
    })
  }
  next()
}

module.exports = attachServices
