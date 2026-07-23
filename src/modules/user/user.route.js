import { Router } from 'express';
import {
  createUserController, listUsersController, getUserController,
  updateUserController, toggleActiveController, resetPasswordController,
  getMyProfileController, updateMyProfileController,
} from './user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import { createUserSchema, updateUserSchema, updateProfileSchema, listUserQuerySchema } from './user.validator.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Self profile — mọi role đã đăng nhập đều dùng được
router.get('/me/profile', authenticate, getMyProfileController);
router.patch('/me/profile', authenticate, validate(updateProfileSchema), updateMyProfileController);

// Admin quản lý user — chỉ SUPER_ADMIN
router.post('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(createUserSchema), createUserController);
router.get('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validateQuery(listUserQuerySchema), listUsersController);
router.get('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), getUserController);
router.patch('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateUserSchema), updateUserController);
router.patch('/:id/status', authenticate, authorize([ROLES.SUPER_ADMIN]), toggleActiveController);
router.post('/:id/reset-password', authenticate, authorize([ROLES.SUPER_ADMIN]), resetPasswordController);

export default router;