import * as userService from './user.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, {
    statusCode: err.statusCode || 500,
    message: err.message || 'Lỗi hệ thống',
  });
};

export const createUserController = async (req, res) => {
  try {
    const { user, initialPassword } = await userService.createUser(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo tài khoản thành công',
      data: { user, initialPassword },
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const bulkCreateUsersController = async (req, res) => {
  try {
    const result = await userService.createUsersBulk(req.body.users);
    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo tài khoản hàng loạt thành công',
      data: result,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listUsersController = async (req, res) => {
  try {
    const result = await userService.listUsers(req.validatedQuery, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getUserController = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateUserController = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return successResponse(res, { message: 'Cập nhật thành công', data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

export const toggleActiveController = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await userService.toggleActiveStatus(req.params.id, isActive);
    return successResponse(res, {
      message: isActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
      data: user,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const result = await userService.resetPassword(req.params.id);
    return successResponse(res, { message: 'Reset mật khẩu thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

// ===== Self profile (Teacher/Student tự cập nhật) =====

export const getMyProfileController = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    return successResponse(res, { message: 'Lấy hồ sơ thành công', data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateMyProfileController = async (req, res) => {
  try {
    const user = await userService.updateUser(req.user.id, req.body);
    return successResponse(res, { message: 'Cập nhật hồ sơ thành công', data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

export const changeMyPasswordController = async (req, res) => {
  try {
    const result = await userService.changeMyPassword(req.user.id, req.body);
    return successResponse(res, { message: 'Đổi mật khẩu thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};