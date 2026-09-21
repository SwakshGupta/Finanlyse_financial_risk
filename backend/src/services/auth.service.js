const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/user.repository');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production_min_32_chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`;
const ACCESS_TOKEN_EXPIRES_IN_SEC = 86400; // 24 hours
const REFRESH_TOKEN_EXPIRES_IN_SEC = 604800; // 7 days

class AuthService {
  generateTokens(user) {
    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SEC
    });

    const refreshToken = jwt.sign(
      { sub: user.id, tokenType: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN_SEC }
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SEC
    };
  }

  async register({ email, password, role = 'APPLICANT' }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    const newUser = await userRepository.create({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      role
    });

    const tokens = this.generateTokens(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      ...tokens
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      if (decoded.tokenType !== 'refresh') {
        throw new UnauthorizedError('Invalid token type for refresh operation');
      }

      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedError('User associated with token no longer exists');
      }

      const payload = {
        sub: user.id,
        id: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SEC
      });

      return {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SEC
      };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

module.exports = new AuthService();
