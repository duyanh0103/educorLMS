import { Router } from 'express';
import {
  createClassController, listClassesController, getClassController,
  updateClassController, updateClassTeachersController, deleteClassController,
} from './class.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  createClassSchema, updateClassSchema, updateClassTeachersSchema, listClassQuerySchema,
} from './class.validator.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Xem — Admin xem hết, Teacher chỉ xem lớp mình phụ trách (xử lý trong service)
router.get('/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]), validateQuery(listClassQuerySchema), listClassesController);
router.get('/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]), getClassController);

// Quản lý — chỉ SUPER_ADMIN
router.post('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(createClassSchema), createClassController);
router.patch('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateClassSchema), updateClassController);
router.patch('/:id/teachers', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateClassTeachersSchema), updateClassTeachersController);
router.delete('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), deleteClassController);

export default router;