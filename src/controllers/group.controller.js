exports.find = async (req, res, next) => {
  try {
    const groupService = req.app.getService('group')
    const groups = await groupService.find({ query: req.query })
    res.json(groups)
  } catch (error) {
    next(error)
  }
}

exports.get = async (req, res, next) => {
  try {
    const groupService = req.app.getService('group')
    const group = await groupService.get(req.params.id, { query: req.query })
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
    const groupService = req.app.getService('group')
    const group = await groupService.create(req.body)
    res.status(201).json(group)
  } catch (error) {
    next(error)
  }
}

exports.patch = async (req, res, next) => {
  try {
    const groupService = req.app.getService('group')
    const group = await groupService.patch(req.params.id, req.body)
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const groupService = req.app.getService('group')
    await groupService.remove(req.params.id, { user: req.user })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
