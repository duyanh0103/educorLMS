import { errorResponse } from '../utils/apiResponse.js';

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, { statusCode: 401, message: 'Chưa xác thực' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, { statusCode: 403, message: 'Không có quyền truy cập' });
    }

    next();
  };
};