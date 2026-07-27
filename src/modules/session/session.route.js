import { Router } from 'express';
import {
  createSessionController, createRecurringSessionsController, listSessionsController,
  updateSessionController, deleteSessionController,
} from './session.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate, validateQuery } from '../../middlewares/validate.js';
import {
  createSingleSessionSchema, createRecurringSchema, updateSessionSchema, listSessionQuerySchema,
} from './session.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router lồng trong /api/classes/:classId/sessions
export const classSessionRouter = Router({ mergeParams: true });

classSessionRouter.post(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createSingleSessionSchema), createSessionController
);
classSessionRouter.post(
  '/recurring', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createRecurringSchema), createRecurringSessionsController
);
classSessionRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  validateQuery(listSessionQuerySchema), listSessionsController
);

// Router độc lập cho /api/sessions/:id
export const sessionRouter = Router();

sessionRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updateSessionSchema), updateSessionController
);
sessionRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deleteSessionController
);
