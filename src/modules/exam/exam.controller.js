import * as examService from './exam.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createExamController = async (req, res) => {
  try {
    const exam = await examService.createExam(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Tạo bài thi thành công', data: exam });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listExamsController = async (req, res) => {
  try {
    const exams = await examService.listExamsByClass(req.params.classId, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: exams });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getExamController = async (req, res) => {
  try {
    const exam = await examService.getExamById(req.params.id, req.user);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: exam });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateExamController = async (req, res) => {
  try {
    const exam = await examService.updateExam(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật thành công', data: exam });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteExamController = async (req, res) => {
  try {
    const result = await examService.deleteExam(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa bài thi thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};