import * as courseService from './course.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createCourseController = async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body);
    return successResponse(res, { statusCode: 201, message: 'Tạo khóa học thành công', data: course });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listCoursesController = async (req, res) => {
  try {
    const result = await courseService.listCourses(req.validatedQuery);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getCourseController = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: course });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateCourseController = async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật thành công', data: course });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteCourseController = async (req, res) => {
  try {
    const result = await courseService.deleteCourse(req.params.id);
    return successResponse(res, { message: 'Xóa khóa học thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};