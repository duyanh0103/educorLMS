import { Router } from 'express';
import {
  createUserController, listUsersController, getUserController,
  updateUserController, toggleActiveController, resetPasswordController,
  getMyProfileController, updateMyProfileController, bulkCreateUsersController,
  changeMyPasswordController,
} from './user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  createUserSchema, updateUserSchema, updateProfileSchema, listUserQuerySchema, bulkCreateUsersSchema,
  changePasswordSchema,
} from './user.validator.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Self profile — mọi role đã đăng nhập đều dùng được
router.get('/me/profile', authenticate, getMyProfileController);
router.patch('/me/profile', authenticate, validate(updateProfileSchema), updateMyProfileController);
router.patch('/me/password', authenticate, validate(changePasswordSchema), changeMyPasswordController);

// Admin quản lý user — chỉ SUPER_ADMIN
router.post('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(createUserSchema), createUserController);
router.post(
  '/bulk', authenticate, authorize([ROLES.SUPER_ADMIN]),
  validate(bulkCreateUsersSchema), bulkCreateUsersController
);
router.get('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validateQuery(listUserQuerySchema), listUsersController);
router.get('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), getUserController);
router.patch('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateUserSchema), updateUserController);
router.patch('/:id/status', authenticate, authorize([ROLES.SUPER_ADMIN]), toggleActiveController);
router.post('/:id/reset-password', authenticate, authorize([ROLES.SUPER_ADMIN]), resetPasswordController);

export default router;