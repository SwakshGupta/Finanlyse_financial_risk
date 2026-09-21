const explanationService = require('../services/explanation.service');

class ExplanationController {
  async getExplanation(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const explanation = await explanationService.getExplanation(applicationId, req.user);
      return res.status(200).json(explanation);
    } catch (err) {
      return next(err);
    }
  }

  async generateExplanation(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const options = req.body || {};
      const explanation = await explanationService.generateExplanation(applicationId, req.user, options);
      return res.status(200).json(explanation);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ExplanationController();
