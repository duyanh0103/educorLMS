import * as retakeRequestService from './retakeRequest.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createRetakeRequestController = async (req, res) => {
  try {
    const result = await retakeRequestService.createRetakeRequest(
      req.params.examId, req.params.submissionId, req.body, req.user,
    );
    return successResponse(res, { statusCode: 201, message: 'Gửi yêu cầu làm lại thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMyRetakeRequestController = async (req, res) => {
  try {
    const result = await retakeRequestService.getMyRetakeRequest(
      req.params.examId, req.params.submissionId, req.user,
    );
    return successResponse(res, { message: 'Lấy thông tin thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listRetakeRequestsController = async (req, res) => {
  try {
    const result = await retakeRequestService.listRetakeRequestsByClass(
      req.params.classId, req.validatedQuery, req.user,
    );
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const approveRetakeRequestController = async (req, res) => {
  try {
    const result = await retakeRequestService.approveRetakeRequest(req.params.requestId, req.user);
    return successResponse(res, { message: 'Đã duyệt yêu cầu làm lại', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const rejectRetakeRequestController = async (req, res) => {
  try {
    const result = await retakeRequestService.rejectRetakeRequest(req.params.requestId, req.body, req.user);
    return successResponse(res, { message: 'Đã từ chối yêu cầu', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};
