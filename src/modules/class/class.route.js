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

// Xem — Admin xem hết, Teacher chỉ xem lớp mình phụ trách
router.get('/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]), validateQuery(listClassQuerySchema), listClassesController);
router.get('/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]), getClassController);

// Tạo — giờ cả SUPER_ADMIN và TEACHER đều tạo được
router.post('/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]), validate(createClassSchema), createClassController);

// Sửa/xóa/quản lý giáo viên — vẫn chỉ SUPER_ADMIN (đảm bảo kiểm soát tập trung)
router.patch('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateClassSchema), updateClassController);
router.patch('/:id/teachers', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateClassTeachersSchema), updateClassTeachersController);
router.delete('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), deleteClassController);

export default router;