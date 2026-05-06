const express = require('express')
const app = express()

// Registro de servicios accesible globalmente (pero sin variable global sucia)
app.services = new Map()

app.registerService = (name, service) => {
  if (app.services.has(name)) {
    throw new Error(`Service ${name} already registered`)
  }
  app.services.set(name, service)
  // También puedes exponerlo como propiedad para acceso directo (opcional)
  app[name] = service
  return service
}

app.getService = (name) => {
  if (!app.services.has(name)) {
    throw new Error(`Service ${name} not registered`)
  }
  return app.services.get(name)
}

module.exports = app
