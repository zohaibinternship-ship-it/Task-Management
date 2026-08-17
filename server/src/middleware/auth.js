import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import * as sessionRepository from '../repositories/session.repository.js';

export function clearSessionCookie(res) {
  res.clearCookie(env.cookieName, { path: '/' });
}

export async function authenticate(req, res, next) {
  try {
    const token = req.signedCookies?.[env.cookieName];
    if (!token) {
      throw ApiError.unauthorized();
    }

    const tokenHash = hashToken(token);
    const session = await sessionRepository.findValidByTokenHash(tokenHash);

    if (!session || !session.user.isActive) {
      clearSessionCookie(res);
      throw ApiError.unauthorized();
    }

    req.session = { id: session.id, userId: session.userId, tokenHash };
    req.user = { ...sanitizeUser(session.user), role: session.user.role.name };
    next();
  } catch (err) {
    next(err);
  }
}
