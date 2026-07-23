import { Router } from 'express';
import {
  createCourseController, listCoursesController, getCourseController,
  updateCourseController, deleteCourseController,
} from './course.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import { createCourseSchema, updateCourseSchema, listCourseQuerySchema } from './course.validator.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Xem — mọi role đã login
router.get('/', authenticate, validateQuery(listCourseQuerySchema), listCoursesController);
router.get('/:id', authenticate, getCourseController);

// Quản lý — chỉ SUPER_ADMIN
router.post('/', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(createCourseSchema), createCourseController);
router.patch('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), validate(updateCourseSchema), updateCourseController);
router.delete('/:id', authenticate, authorize([ROLES.SUPER_ADMIN]), deleteCourseController);

export default router;