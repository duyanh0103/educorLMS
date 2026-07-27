import * as sessionService from './session.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, {
    statusCode: err.statusCode || 500,
    message: err.message || 'Lỗi hệ thống',
    errors: err.details || [],
  });
};

export const createSessionController = async (req, res) => {
  try {
    const session = await sessionService.createSession(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Tạo buổi học thành công', data: session });
  } catch (err) {
    return handleError(res, err);
  }
};

export const createRecurringSessionsController = async (req, res) => {
  try {
    const result = await sessionService.createRecurringSessions(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Tạo lịch lặp hoàn tất', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listSessionsController = async (req, res) => {
  try {
    const sessions = await sessionService.listSessionsByClass(req.params.classId, req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: sessions });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateSessionController = async (req, res) => {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật thành công', data: session });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteSessionController = async (req, res) => {
  try {
    const result = await sessionService.deleteSession(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa buổi học thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};
