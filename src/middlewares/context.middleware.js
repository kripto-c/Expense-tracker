const { runWithContext } = require('../context')

function contextMiddleware(req, res, next) {
  const store = { user: req.user } // req.user ya fue setado por tu middleware global de auth
  runWithContext(store, () => {
    next()
  })
}

module.exports = contextMiddleware
