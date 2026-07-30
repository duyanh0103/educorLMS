import { Router } from 'express';
import {
  createRetakeRequestController, getMyRetakeRequestController,
  listRetakeRequestsController, approveRetakeRequestController, rejectRetakeRequestController,
} from './retakeRequest.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  createRetakeRequestSchema, rejectRetakeRequestSchema, listRetakeRequestQuerySchema,
} from './retakeRequest.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router lồng trong /api/exams/:examId/submissions (cho Student)
export const examSubmissionRetakeRouter = Router({ mergeParams: true });

examSubmissionRetakeRouter.post(
  '/:submissionId/retake-requests', authenticate, authorize([ROLES.STUDENT]),
  validate(createRetakeRequestSchema), createRetakeRequestController,
);
examSubmissionRetakeRouter.get(
  '/:submissionId/retake-request', authenticate, authorize([ROLES.STUDENT]),
  getMyRetakeRequestController,
);

// Router lồng trong /api/classes/:classId/retake-requests (cho Teacher/Admin xem danh sách)
export const classRetakeRequestRouter = Router({ mergeParams: true });

classRetakeRequestRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validateQuery(listRetakeRequestQuerySchema), listRetakeRequestsController,
);

// Router độc lập cho /api/retake-requests/:requestId (approve/reject)
export const retakeRequestRouter = Router();

retakeRequestRouter.post(
  '/:requestId/approve', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  approveRetakeRequestController,
);
retakeRequestRouter.post(
  '/:requestId/reject', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(rejectRetakeRequestSchema), rejectRetakeRequestController,
);
