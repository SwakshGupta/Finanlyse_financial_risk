const applicationService = require('../services/application.service');
const financialService = require('../services/financial.service');

class ApplicationController {
  async createApplication(req, res, next) {
    try {
      const application = await applicationService.createApplication(req.user.id, req.body);
      return res.status(201).json(application);
    } catch (err) {
      return next(err);
    }
  }

  async listApplications(req, res, next) {
    try {
      const applications = await applicationService.listApplications(req.user);
      return res.status(200).json(applications);
    } catch (err) {
      return next(err);
    }
  }

  async getApplication(req, res, next) {
    try {
      const { applicationId } = req.params;
      const application = await applicationService.getApplication(applicationId, req.user);
      return res.status(200).json(application);
    } catch (err) {
      return next(err);
    }
  }

  async updateApplication(req, res, next) {
    try {
      const { applicationId } = req.params;
      const application = await applicationService.updateApplication(applicationId, req.user, req.body);
      return res.status(200).json(application);
    } catch (err) {
      return next(err);
    }
  }

  async upsertFinancialProfile(req, res, next) {
    try {
      const { applicationId } = req.params;
      const response = await financialService.upsertProfile(applicationId, req.user, req.body);
      return res.status(200).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async addTransactions(req, res, next) {
    try {
      const { applicationId } = req.params;
      const response = await financialService.addTransactions(applicationId, req.user, req.body);
      return res.status(201).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async getFinancialSummary(req, res, next) {
    try {
      const { applicationId } = req.params;
      const response = await financialService.getFinancialSummary(applicationId, req.user);
      return res.status(200).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async ingestSynthetic(req, res, next) {
    try {
      const { applicationId } = req.params;
      const { presetName = 'THIN_FILE_GIG_WORKER' } = req.body || {};
      const response = await financialService.ingestSyntheticPreset(applicationId, req.user, presetName);
      return res.status(200).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async ingestCsv(req, res, next) {
    try {
      const { applicationId } = req.params;
      const { csvContent } = req.body || {};
      const response = await financialService.ingestCsvTransactions(applicationId, req.user, csvContent);
      return res.status(201).json(response);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ApplicationController();
