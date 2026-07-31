import * as submissionService from './submission.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const startSubmissionController = async (req, res) => {
  try {
    const result = await submissionService.startSubmission(req.params.examId, req.user);
    return successResponse(res, { message: 'Bắt đầu làm bài thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMySubmissionController = async (req, res) => {
  try {
    const result = await submissionService.getMySubmission(req.params.examId, req.user);
    return successResponse(res, { message: 'Lấy bài nộp thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const submitSubmissionController = async (req, res) => {
  try {
    const result = await submissionService.submitSubmission(req.params.examId, req.body, req.user);
    return successResponse(res, { message: 'Nộp bài thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listSubmissionsController = async (req, res) => {
  try {
    const result = await submissionService.listSubmissionsByExam(req.params.examId, req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getSubmissionController = async (req, res) => {
  try {
    const result = await submissionService.getSubmissionById(req.params.id, req.user);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const gradeSubmissionController = async (req, res) => {
  try {
    const result = await submissionService.gradeSubmission(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Chấm điểm thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const reopenSubmissionController = async (req, res) => {
  try {
    const result = await submissionService.reopenSubmission(req.params.examId, req.params.studentId, req.user);
    return successResponse(res, { statusCode: 201, message: 'Mở lại bài thi thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};
