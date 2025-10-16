import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registra un nuovo utente
 * @access  Public
 * @body    { name, surname, email, password }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/register', registerLimiter, registerController);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente esistente
 * @access  Public
 * @body    { email, password }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/login', loginLimiter, loginController);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rinnova access token usando refresh token
 * @access  Public
 * @body    { refreshToken }
 * @returns { accessToken }
 */
router.post('/refresh', refreshTokenController);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente (blacklist refresh token)
 * @access  Public
 * @body    { refreshToken }
 * @returns { success, message }
 */
router.post('/logout', logoutController);

// Password reset
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', forgotPasswordLimiter, resetPasswordController);

export default router;