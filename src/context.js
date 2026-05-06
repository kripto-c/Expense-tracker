const { AsyncLocalStorage } = require('async_hooks')

const asyncLocalStorage = new AsyncLocalStorage()

function runWithContext(store, callback) {
  return asyncLocalStorage.run(store, callback)
}

function getCurrentUser() {
  const store = asyncLocalStorage.getStore()
  return store?.user || null
}

function getCurrentContext() {
  return asyncLocalStorage.getStore() || {}
}

module.exports = { runWithContext, getCurrentUser, getCurrentContext }
