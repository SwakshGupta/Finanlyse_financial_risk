const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email address is required'),
    body('password')
      .isString()
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters'),
    body('role')
      .optional()
      .isIn(['APPLICANT', 'ANALYST'])
      .withMessage('Role must be either APPLICANT or ANALYST'),
    validate
  ],
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email address is required'),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ],
  authController.login
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  [
    body('refreshToken')
      .isString()
      .isLength({ min: 20 })
      .withMessage('Valid refreshToken string of at least 20 characters is required'),
    validate
  ],
  authController.refresh
);

// GET /api/v1/auth/me (Protected Route)
router.get(
  '/me',
  authenticate,
  authController.getMe
);

// GET /api/v1/auth/analyst-only (Role-protected: ANALYST, ADMIN)
router.get(
  '/analyst-only',
  authenticate,
  authorize('ANALYST', 'ADMIN'),
  (req, res) => res.status(200).json({ status: 'ANALYST_ACCESS_GRANTED', user: req.user })
);

module.exports = router;
