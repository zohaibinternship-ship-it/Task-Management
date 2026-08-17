import { env, isProduction } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearSessionCookie } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';

function setSessionCookie(res, token, expiresAt) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    signed: true,
    path: '/',
    expires: expiresAt,
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, expiresAt, user } = await authService.login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? null,
  });

  setSessionCookie(res, token, expiresAt);
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout({ session: req.session, actorRole: req.user.role });
  clearSessionCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({
    userId: req.user.id,
    currentSessionId: req.session.id,
    currentPassword,
    newPassword,
    actorRole: req.user.role,
  });
  res.json({ message: 'Password changed successfully' });
});
