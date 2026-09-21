const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map(err => ({
    field: err.path || err.param,
    issue: err.msg
  }));

  return next(new ValidationError('Request validation failed', details));
}

module.exports = validate;
