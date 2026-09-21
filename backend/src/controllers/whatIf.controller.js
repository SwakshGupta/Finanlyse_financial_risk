const whatIfService = require('../services/whatIf.service');

class WhatIfController {
  async runWhatIf(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const { overrides } = req.body;
      const result = await whatIfService.runWhatIf(applicationId, req.user, { overrides });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new WhatIfController();
