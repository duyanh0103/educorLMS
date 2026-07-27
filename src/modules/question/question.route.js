import { Router } from 'express';
import {
  createQuestionController, listQuestionsController,
  updateQuestionController, deleteQuestionController,
} from './question.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createQuestionSchema, updateQuestionSchema } from './question.validator.js';
import { ROLES } from '../../constants/roles.js';
import { errorResponse } from '../../utils/apiResponse.js';

import { uploadQuestionFile } from '../../config/multer.js';
import { importQuestionsController } from './question.controller.js';

// Router lồng trong /api/exams/:examId/questions
export const examQuestionRouter = Router({ mergeParams: true });

examQuestionRouter.post(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createQuestionSchema), createQuestionController
);
examQuestionRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  listQuestionsController
);

// Router độc lập cho /api/questions/:id
export const questionRouter = Router();

questionRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updateQuestionSchema), updateQuestionController
);
questionRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deleteQuestionController
);

// Middleware xử lý lỗi Multer riêng (vì multer throw lỗi khác định dạng response chuẩn)
const handleMulterUpload = (req, res, next) => {
  uploadQuestionFile(req, res, (err) => {
    if (err) {
      return errorResponse(res, { statusCode: 400, message: err.message });
    }
    next();
  });
};

examQuestionRouter.post(
  '/import',
  authenticate,
  authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  handleMulterUpload,
  importQuestionsController
);