import { Router } from 'express';
import { loginController, refreshController, logoutController, meController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { loginSchema } from './auth.validator.js';

const router = Router();

router.post('/login', validate(loginSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/me', authenticate, meController);

export default router;