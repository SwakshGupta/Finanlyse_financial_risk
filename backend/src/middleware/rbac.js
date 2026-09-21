const { ForbiddenError } = require('../utils/errors');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context not established'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access forbidden: user role '${req.user.role}' is not authorized for this action`));
    }

    next();
  };
}

module.exports = authorize;
