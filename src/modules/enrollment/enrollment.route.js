import { Router } from 'express';
import {
  enrollStudentsController, listClassEnrollmentsController,
  unenrollStudentController, getMyClassesController,
} from './enrollment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import { enrollStudentsSchema, listEnrollmentQuerySchema } from './enrollment.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router cho /api/classes/:classId/enrollments
export const classEnrollmentRouter = Router({ mergeParams: true });

classEnrollmentRouter.post(
  '/',
  authenticate,
  authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(enrollStudentsSchema),
  enrollStudentsController
);
classEnrollmentRouter.get(
  '/',
  authenticate,
  authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validateQuery(listEnrollmentQuerySchema),
  listClassEnrollmentsController
);
classEnrollmentRouter.delete(
  '/:studentId',
  authenticate,
  authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  unenrollStudentController
);

// Router cho /api/students/me/classes
export const studentRouter = Router();

studentRouter.get(
  '/me/classes',
  authenticate,
  authorize([ROLES.STUDENT]),
  validateQuery(listEnrollmentQuerySchema),
  getMyClassesController
);
