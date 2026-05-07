exports.find = async (req, res, next) => {
  try {
    const roles = await req.services.role.find({ query: req.query })
    res.json(roles)
  } catch (error) {
    next(error)
  }
}

exports.get = async (req, res, next) => {
  try {
    const role = await req.services.role.get(req.params.id)
    if (!role) return res.status(404).json({ error: 'Role not found' })
    res.json(role)
  } catch (error) {
    next(error)
  }
}

exports.create = async (req, res, next) => {
  try {
    const role = await req.services.role.create(req.body)
    res.status(201).json(role)
  } catch (error) {
    next(error)
  }
}

exports.patch = async (req, res, next) => {
  try {
    const role = await req.services.role.patch(req.params.id, req.body)
    res.json(role)
  } catch (error) {
    next(error)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const role = await req.services.role.remove(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
