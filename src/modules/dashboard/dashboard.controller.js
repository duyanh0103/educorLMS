import * as dashboardService from './dashboard.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const getAdminDashboardController = async (req, res) => {
  try {
    const result = await dashboardService.getAdminDashboard();
    return successResponse(res, { message: 'Lấy dashboard thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getTeacherDashboardController = async (req, res) => {
  try {
    const result = await dashboardService.getTeacherDashboard(req.user.id);
    return successResponse(res, { message: 'Lấy dashboard thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};
