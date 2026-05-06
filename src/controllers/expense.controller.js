exports.find = async (req, res, next) => {
  try {
    const ExpenseService = req.app.getService('expense')
    const groups = await ExpenseService.find({ user: req.user, query: req.query })
    res.json(groups)
  } catch (error) {
    next(error)
  }
}

exports.get = async (req, res, next) => {
  try {
    const ExpenseService = req.app.getService('expense')
    const group = await ExpenseService.get(req.params.id, { user: req.user, query: req.query })
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
    const ExpenseService = req.app.getService('expense')
    const group = await ExpenseService.create(req.body, { user: req.user })
    res.status(201).json(group)
  } catch (error) {
    next(error)
  }
}

exports.patch = async (req, res, next) => {
  try {
    const ExpenseService = req.app.getService('expense')
    const group = await ExpenseService.patch(req.params.id, req.body, { user: req.user })
    res.json(group)
  } catch (error) {
    next(error)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const ExpenseService = req.app.getService('expense')
    await ExpenseService.remove(req.params.id, { user: req.user })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
