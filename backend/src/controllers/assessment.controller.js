const assessmentService = require('../services/assessment.service');

class AssessmentController {
  async assessApplication(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const assessment = await assessmentService.assessApplication(applicationId, req.user, req.body);
      res.status(200).json(assessment);
    } catch (err) {
      next(err);
    }
  }

  async getAssessment(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const assessment = await assessmentService.getAssessment(applicationId, req.user);
      res.status(200).json(assessment);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssessmentController();
