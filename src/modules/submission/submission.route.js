import { Router } from 'express';
import {
  startSubmissionController, submitSubmissionController, listSubmissionsController,
  getSubmissionController, gradeSubmissionController, reopenSubmissionController,
  getMySubmissionController,
} from './submission.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  submitAnswersSchema, gradeSubmissionSchema, listSubmissionQuerySchema,
} from './submission.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router lồng trong /api/exams/:examId/submissions
export const examSubmissionRouter = Router({ mergeParams: true });

examSubmissionRouter.post(
  '/start', authenticate, authorize([ROLES.STUDENT]),
  startSubmissionController
);
examSubmissionRouter.post(
  '/submit', authenticate, authorize([ROLES.STUDENT]),
  validate(submitAnswersSchema), submitSubmissionController
);
examSubmissionRouter.get(
  '/mine', authenticate, authorize([ROLES.STUDENT]),
  getMySubmissionController
);
examSubmissionRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validateQuery(listSubmissionQuerySchema), listSubmissionsController
);

// Router độc lập cho /api/submissions/:id
export const submissionRouter = Router();

submissionRouter.get(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  getSubmissionController
);
submissionRouter.patch(
  '/:id/grade', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(gradeSubmissionSchema), gradeSubmissionController
);

// Router lồng trong /api/exams/:examId/students (cho thao tác reopen)
export const examStudentRouter = Router({ mergeParams: true });

examStudentRouter.post(
  '/:studentId/reopen', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  reopenSubmissionController
);
