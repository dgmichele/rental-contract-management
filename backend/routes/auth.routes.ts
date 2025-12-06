import { Router, Request, Response } from 'express';

const router = Router();

console.log('[AUTH_ROUTES] ✅ File caricato correttamente');

// Route minimali senza NESSUNA dipendenza esterna
router.post('/register', (req: Request, res: Response) => {
  console.log('[AUTH] /register chiamato');
  res.json({ success: true, message: 'Register route OK' });
});

router.post('/login', (req: Request, res: Response) => {
  console.log('[AUTH] /login chiamato');
  res.json({ success: true, message: 'Login route OK' });
});

router.post('/refresh', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Refresh route OK' });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logout route OK' });
});

router.post('/forgot-password', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Forgot password route OK' });
});

router.post('/reset-password', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Reset password route OK' });
});

console.log('[AUTH_ROUTES] ✅ Tutte le route definite');

export default router;