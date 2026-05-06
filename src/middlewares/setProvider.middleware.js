function setProvider(req, res, next) {
  // Por ahora solo manejamos REST; si luego agregas Socket.io, puedes detectarlo
  req.provider = 'rest'
  next()
}

module.exports = setProvider
