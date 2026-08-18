import { Router } from 'express';
import {
  getAdminDashboardController, getTeacherDashboardController, getStudentDashboardController,
} from './dashboard.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';

export const dashboardRouter = Router();

dashboardRouter.get('/admin', authenticate, authorize([ROLES.SUPER_ADMIN]), getAdminDashboardController);
dashboardRouter.get('/teacher', authenticate, authorize([ROLES.TEACHER]), getTeacherDashboardController);
dashboardRouter.get('/student', authenticate, authorize([ROLES.STUDENT]), getStudentDashboardController);
