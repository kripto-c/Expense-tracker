// src/hooks/user.js
const bcrypt = require('bcrypt')

const generateUserName = async (context) => {
  const email = context.data.email
  if (!email) return context
  let base = email
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
  context.data.name = base
  return context
}

const hashPassword = async (context) => {
  if (context.data.password) {
    const salt = await bcrypt.genSalt(10)
    context.data.password = await bcrypt.hash(context.data.password, salt)
  }
  return context
}

module.exports = { generateUserName, hashPassword }
