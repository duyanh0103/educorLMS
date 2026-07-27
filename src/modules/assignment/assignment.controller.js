import * as assignmentService from './assignment.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createAssignmentController = async (req, res) => {
  try {
    const assignment = await assignmentService.createAssignment(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Tạo bài tập thành công', data: assignment });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listAssignmentsController = async (req, res) => {
  try {
    const assignments = await assignmentService.listAssignmentsByClass(req.params.classId, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: assignments });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getAssignmentController = async (req, res) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.user);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: assignment });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateAssignmentController = async (req, res) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật thành công', data: assignment });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteAssignmentController = async (req, res) => {
  try {
    const result = await assignmentService.deleteAssignment(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa bài tập thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const submitAssignmentController = async (req, res) => {
  try {
    const submission = await assignmentService.submitAssignment(
      req.params.id,
      { file: req.file, note: req.body.note },
      req.user
    );
    return successResponse(res, { statusCode: 201, message: 'Nộp bài tập thành công', data: submission });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listAssignmentSubmissionsController = async (req, res) => {
  try {
    const result = await assignmentService.listSubmissionsByAssignment(req.params.id, req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMySubmissionController = async (req, res) => {
  try {
    const submission = await assignmentService.getMySubmission(req.params.id, req.user);
    const message = submission ? 'Lấy bài nộp thành công' : 'Bạn chưa nộp bài tập này';
    return successResponse(res, { message, data: submission });
  } catch (err) {
    return handleError(res, err);
  }
};

export const gradeAssignmentSubmissionController = async (req, res) => {
  try {
    const submission = await assignmentService.gradeSubmission(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Chấm điểm thành công', data: submission });
  } catch (err) {
    return handleError(res, err);
  }
};
