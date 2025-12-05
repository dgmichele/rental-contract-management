import { Router } from 'express';

const router = Router();

// ============= ROTTA DI TEST (NESSUNA DIPENDENZA) =============
router.post('/register', (req, res) => {
    // Questo è il codice che DEVE essere eseguito se il router si monta
    res.status(200).json({ success: true, message: 'ROUTER MONTATO E FUNZIONANTE' });
});
// ==============================================================

// @ts-ignore
module.exports = router;

// import { Router } from 'express';
// import {
//   registerController,
//   loginController,
//   refreshTokenController,
//   logoutController,
//   forgotPasswordController,
//   resetPasswordController,
// } from '../controllers/auth.controller';
// import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.middleware";

// const router = Router();

// /**
//  * @route   POST /api/auth/register
//  * @desc    Registra un nuovo utente
//  * @access  Public
//  * @body    { name, surname, email, password }
//  * @returns { accessToken, refreshToken, user }
//  */
// router.post('/register', registerLimiter, registerController);

// /**
//  * @route   POST /api/auth/login
//  * @desc    Login utente esistente
//  * @access  Public
//  * @body    { email, password }
//  * @returns { accessToken, refreshToken, user }
//  */
// router.post('/login', loginLimiter, loginController);

// /**
//  * @route   POST /api/auth/refresh
//  * @desc    Rinnova access token usando refresh token
//  * @access  Public
//  * @body    { refreshToken }
//  * @returns { accessToken }
//  */
// router.post('/refresh', refreshTokenController);

// /**
//  * @route   POST /api/auth/logout
//  * @desc    Logout utente (blacklist refresh token)
//  * @access  Public
//  * @body    { refreshToken }
//  * @returns { success, message }
//  */
// router.post('/logout', logoutController);

// // Password reset
// router.post('/forgot-password', forgotPasswordController);
// router.post('/reset-password', forgotPasswordLimiter, resetPasswordController);

// module.exports = router;