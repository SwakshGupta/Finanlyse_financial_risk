const { v4: uuidv4 } = require('uuid');
const applicationRepository = require('../repositories/application.repository');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');

class ApplicationService {
  async createApplication(userId, payload) {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Application payload must be provided');
    }

    const { applicant, consent, dataSource = 'MANUAL_INPUT' } = payload;

    if (!applicant || !applicant.fullName || typeof applicant.fullName !== 'string' || applicant.fullName.trim().length === 0) {
      throw new ValidationError('Applicant fullName is required');
    }

    if (!Array.isArray(consent) || consent.length === 0) {
      throw new ValidationError('Consent array must contain at least one consent record');
    }

    // Generate applicationId conforming to OpenAPI pattern ^app_[A-Za-z0-9_-]{8,64}$
    const applicationId = `app_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    const application = await applicationRepository.create({
      id: applicationId,
      userId,
      status: 'DRAFT',
      applicant: {
        fullName: applicant.fullName.trim(),
        phone: applicant.phone || null,
        employmentType: applicant.employmentType || null
      },
      consents: consent,
      dataSources: [dataSource]
    });

    return application;
  }

  async getApplication(applicationId, user) {
    const application = await applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundError(`Application with id '${applicationId}' not found`);
    }

    // Access check: User must own the application OR have role ANALYST/ADMIN
    if (user.role !== 'ANALYST' && user.role !== 'ADMIN' && application.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to view this application');
    }

    return application;
  }

  async updateApplication(applicationId, user, updateData) {
    const application = await this.getApplication(applicationId, user);

    if (application.status === 'ASSESSING' || application.status === 'ASSESSED') {
      throw new ConflictError(`Application cannot be modified once in '${application.status}' status`);
    }

    const updated = await applicationRepository.update(applicationId, {
      status: updateData.status || application.status,
      applicant: updateData.applicant || null
    });

    return updated;
  }

  async getUserApplications(userId) {
    return applicationRepository.findByUserId(userId);
  }
}

module.exports = new ApplicationService();
