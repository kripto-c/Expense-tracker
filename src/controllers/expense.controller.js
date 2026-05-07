exports.find = async (req, res, next) => {
  try {
    const groups = await req.services.expense.find({ user: req.user, query: req.query })
    res.json(groups)
  } catch (error) {
    next(error)
  }
}

exports.get = async (req, res, next) => {
  try {
    const group = await req.services.expense.get(req.params.id, { user: req.user, query: req.query })
    if (!group) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.create = async (req, res, next) => {
  try {
    const group = await req.services.expense.create(req.body, { user: req.user })
    res.status(201).json(group)
  } catch (error) {
    next(error)
  }
}

exports.patch = async (req, res, next) => {
  try {
    const group = await req.services.expense.patch(req.params.id, req.body, { user: req.user })
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const group = await req.services.expense.remove(req.params.id, { user: req.user })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
