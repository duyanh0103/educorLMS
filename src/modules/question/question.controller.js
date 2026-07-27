import * as questionService from './question.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createQuestionController = async (req, res) => {
  try {
    const question = await questionService.createQuestion(req.params.examId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Thêm câu hỏi thành công', data: question });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listQuestionsController = async (req, res) => {
  try {
    const questions = await questionService.listQuestionsByExam(req.params.examId, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: questions });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateQuestionController = async (req, res) => {
  try {
    const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật thành công', data: question });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteQuestionController = async (req, res) => {
  try {
    const result = await questionService.deleteQuestion(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa câu hỏi thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};
export const importQuestionsController = async (req, res) => {
  try {
    const result = await questionService.importQuestions(req.params.examId, req.file, req.user);
    return successResponse(res, { statusCode: 201, message: 'Import câu hỏi hoàn tất', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};