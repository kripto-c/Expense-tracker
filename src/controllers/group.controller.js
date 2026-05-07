exports.find = async (req, res, next) => {
  try {
    const groups = await req.services.group.find({ query: req.query })
    res.json(groups)
  } catch (error) {
    next(error)
  }
}

exports.get = async (req, res, next) => {
  try {
    const group = await req.services.group.get(req.params.id, { query: req.query })
    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.create = async (req, res, next) => {
  try {
    const group = await req.services.group.create(req.body)
    res.status(201).json(group)
  } catch (error) {
    next(error)
  }
}

exports.patch = async (req, res, next) => {
  try {
    const group = await req.services.group.patch(req.params.id, req.body)
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const group = await req.services.group.remove(req.params.id, { user: req.user })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
