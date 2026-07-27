import { Router } from 'express';
import {
  createExamController, listExamsController, getExamController,
  updateExamController, deleteExamController,
} from './exam.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createExamSchema, updateExamSchema } from './exam.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router lồng trong /api/classes/:classId/exams
export const classExamRouter = Router({ mergeParams: true });

classExamRouter.post(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createExamSchema), createExamController
);
classExamRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  listExamsController
);

// Router độc lập cho /api/exams/:id
export const examRouter = Router();

examRouter.get(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  getExamController
);
examRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updateExamSchema), updateExamController
);
examRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deleteExamController
);