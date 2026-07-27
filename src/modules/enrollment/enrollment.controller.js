import * as enrollmentService from './enrollment.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const enrollStudentsController = async (req, res) => {
  try {
    const result = await enrollmentService.enrollStudents(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Xử lý enroll hoàn tất', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listClassEnrollmentsController = async (req, res) => {
  try {
    const result = await enrollmentService.listClassEnrollments(req.params.classId, req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const unenrollStudentController = async (req, res) => {
  try {
    const result = await enrollmentService.unenrollStudent(req.params.classId, req.params.studentId, req.user);
    return successResponse(res, { message: 'Gỡ học sinh khỏi lớp thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMyClassesController = async (req, res) => {
  try {
    const result = await enrollmentService.getMyClasses(req.user.id, req.validatedQuery);
    return successResponse(res, { message: 'Lấy danh sách lớp thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};