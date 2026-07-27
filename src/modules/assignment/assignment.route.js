import { Router } from 'express';
import {
  createAssignmentController, listAssignmentsController, getAssignmentController,
  updateAssignmentController, deleteAssignmentController, submitAssignmentController,
  listAssignmentSubmissionsController, getMySubmissionController, gradeAssignmentSubmissionController,
} from './assignment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  createAssignmentSchema, updateAssignmentSchema, gradeAssignmentSubmissionSchema, listSubmissionQuerySchema,
} from './assignment.validator.js';
import { ROLES } from '../../constants/roles.js';
import { uploadAssignmentFile } from '../../config/multerAssignment.js';
import { errorResponse } from '../../utils/apiResponse.js';

// Middleware xử lý lỗi Multer riêng (vì multer throw lỗi khác định dạng response chuẩn)
const handleMulterUpload = (req, res, next) => {
  uploadAssignmentFile(req, res, (err) => {
    if (err) {
      return errorResponse(res, { statusCode: 400, message: err.message });
    }
    next();
  });
};

// Router lồng trong /api/classes/:classId/assignments
export const classAssignmentRouter = Router({ mergeParams: true });

classAssignmentRouter.post(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createAssignmentSchema), createAssignmentController
);
classAssignmentRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  listAssignmentsController
);

// Router độc lập cho /api/assignments/:id
export const assignmentRouter = Router();

assignmentRouter.get(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  getAssignmentController
);
assignmentRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updateAssignmentSchema), updateAssignmentController
);
assignmentRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deleteAssignmentController
);
assignmentRouter.post(
  '/:id/submit', authenticate, authorize([ROLES.STUDENT]),
  handleMulterUpload, submitAssignmentController
);
assignmentRouter.get(
  '/:id/submissions', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validateQuery(listSubmissionQuerySchema), listAssignmentSubmissionsController
);
assignmentRouter.get(
  '/:id/submissions/me', authenticate, authorize([ROLES.STUDENT]),
  getMySubmissionController
);

// Router độc lập cho /api/assignment-submissions/:id
export const assignmentSubmissionRouter = Router();

assignmentSubmissionRouter.patch(
  '/:id/grade', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(gradeAssignmentSubmissionSchema), gradeAssignmentSubmissionController
);
