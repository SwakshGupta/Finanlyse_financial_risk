const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register({ email, password, role });
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json({ user: profile });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuthController();
