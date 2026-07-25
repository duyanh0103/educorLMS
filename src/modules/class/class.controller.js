import * as classService from './class.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createClassController = async (req, res) => {
  try {
    const classData = await classService.createClass(req.body);
    return successResponse(res, { statusCode: 201, message: 'Tạo lớp học thành công', data: classData });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listClassesController = async (req, res) => {
  try {
    const result = await classService.listClasses(req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getClassController = async (req, res) => {
  try {
    const classData = await classService.getClassById(req.params.id, req.user);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: classData });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateClassController = async (req, res) => {
  try {
    const classData = await classService.updateClass(req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật thành công', data: classData });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateClassTeachersController = async (req, res) => {
  try {
    const classData = await classService.updateClassTeachers(req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật giáo viên phụ trách thành công', data: classData });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteClassController = async (req, res) => {
  try {
    const result = await classService.deleteClass(req.params.id);
    return successResponse(res, { message: 'Xóa lớp học thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};