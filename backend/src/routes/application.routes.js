const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/application.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All application routes require authentication
router.use(authenticate);

const applicationIdParamCheck = param('applicationId')
  .matches(/^app_[A-Za-z0-9_-]{8,64}$/)
  .withMessage('applicationId must match pattern ^app_[A-Za-z0-9_-]{8,64}$');

// GET /api/v1/applications - List applications (user's applications or all if analyst)
router.get('/', applicationController.listApplications);

// POST /api/v1/applications - Create application
router.post(
  '/',
  [
    body('applicant').isObject().withMessage('applicant object is required'),
    body('applicant.fullName').trim().notEmpty().withMessage('applicant.fullName is required'),
    body('applicant.email').optional().isEmail().withMessage('applicant.email must be a valid email'),
    body('consent').isArray({ min: 1 }).withMessage('consent array must contain at least one consent record'),
    body('dataSource')
      .optional()
      .isIn(['MANUAL_INPUT', 'SYNTHETIC', 'UPLOADED_STATEMENT', 'ACCOUNT_AGGREGATOR', 'BUREAU'])
      .withMessage('dataSource must be a recognized source type'),
    validate
  ],
  applicationController.createApplication
);

// GET /api/v1/applications/:applicationId - Get application
router.get(
  '/:applicationId',
  [applicationIdParamCheck, validate],
  applicationController.getApplication
);

// PUT /api/v1/applications/:applicationId - Update application
router.put(
  '/:applicationId',
  [
    applicationIdParamCheck,
    body('status').optional().isIn(['DRAFT', 'READY_FOR_ASSESSMENT']),
    validate
  ],
  applicationController.updateApplication
);

// POST /api/v1/applications/:applicationId/financial-profile - Ingest financial profile
router.post(
  '/:applicationId/financial-profile',
  [
    applicationIdParamCheck,
    body('monthlyIncome').isFloat({ min: 0 }).withMessage('monthlyIncome must be a non-negative number'),
    body('monthlyExpenses').isFloat({ min: 0 }).withMessage('monthlyExpenses must be a non-negative number'),
    body('monthlyEmi').isFloat({ min: 0 }).withMessage('monthlyEmi must be a non-negative number'),
    body('averageBalance').isNumeric().withMessage('averageBalance must be a number'),
    validate
  ],
  applicationController.upsertFinancialProfile
);

// POST /api/v1/applications/:applicationId/transactions - Add transaction batch
router.post(
  '/:applicationId/transactions',
  [
    applicationIdParamCheck,
    body('transactions').isArray({ min: 1 }).withMessage('transactions array must have at least 1 transaction'),
    body('transactions.*.amount').isFloat({ gt: 0 }).withMessage('transaction amount must be greater than 0'),
    body('transactions.*.direction').isIn(['CREDIT', 'DEBIT']).withMessage('transaction direction must be CREDIT or DEBIT'),
    validate
  ],
  applicationController.addTransactions
);

// GET /api/v1/applications/:applicationId/financial-summary - Get financial summary
router.get(
  '/:applicationId/financial-summary',
  [applicationIdParamCheck, validate],
  applicationController.getFinancialSummary
);

// POST /api/v1/applications/:applicationId/synthetic - Ingest synthetic preset
router.post(
  '/:applicationId/synthetic',
  [
    applicationIdParamCheck,
    body('presetName').optional().isString(),
    validate
  ],
  applicationController.ingestSynthetic
);

// POST /api/v1/applications/:applicationId/csv-transactions - Ingest CSV transactions
router.post(
  '/:applicationId/csv-transactions',
  [
    applicationIdParamCheck,
    body('csvContent').isString().notEmpty().withMessage('csvContent string is required'),
    validate
  ],
  applicationController.ingestCsv
);

// =============================================================================
// Risk Assessment Endpoints
// =============================================================================
const assessmentController = require('../controllers/assessment.controller');

// POST /api/v1/applications/:applicationId/assess - Run risk assessment
router.post(
  '/:applicationId/assess',
  [
    applicationIdParamCheck,
    body('regenerateExplanation').optional().isBoolean(),
    body('forceRecomputeFeatures').optional().isBoolean(),
    validate
  ],
  assessmentController.assessApplication
);

// GET /api/v1/applications/:applicationId/assessment - Get latest risk assessment
router.get(
  '/:applicationId/assessment',
  [
    applicationIdParamCheck,
    validate
  ],
  assessmentController.getAssessment
);

// =============================================================================
// LLM Explainability Endpoints
// =============================================================================
const explanationController = require('../controllers/explanation.controller');

// GET /api/v1/applications/:applicationId/explanation - Get latest explanation
router.get(
  '/:applicationId/explanation',
  [
    applicationIdParamCheck,
    validate
  ],
  explanationController.getExplanation
);

// POST /api/v1/applications/:applicationId/explanation - Generate or regenerate explanation
router.post(
  '/:applicationId/explanation',
  [
    applicationIdParamCheck,
    body('provider').optional().isString(),
    body('model').optional().isString(),
    body('forceRegenerate').optional().isBoolean(),
    validate
  ],
  explanationController.generateExplanation
);

// =============================================================================
// Conversational AI Credit Assistant
// =============================================================================
const chatController = require('../controllers/chat.controller');

// POST /api/v1/applications/:applicationId/chat - Send message to LLM assistant
router.post(
  '/:applicationId/chat',
  [
    applicationIdParamCheck,
    body('message').trim().notEmpty().withMessage('message string is required'),
    body('history').optional().isArray().withMessage('history must be an array'),
    body('mode').optional().isIn(['ANALYST', 'APPLICANT']).withMessage('mode must be ANALYST or APPLICANT'),
    validate
  ],
  chatController.sendMessage
);

// =============================================================================
// What-if Counterfactual Scenario Analysis
// =============================================================================
const whatIfController = require('../controllers/whatIf.controller');

// POST /api/v1/applications/:applicationId/what-if - Run what-if scenario
router.post(
  '/:applicationId/what-if',
  [
    applicationIdParamCheck,
    body('overrides').isObject().withMessage('overrides object is required'),
    validate
  ],
  whatIfController.runWhatIf
);

module.exports = router;



