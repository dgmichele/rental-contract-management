import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
} from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registra un nuovo utente
 * @access  Public
 * @body    { name, surname, email, password }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/register', registerController);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente esistente
 * @access  Public
 * @body    { email, password }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/login', loginController);

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

export default router;