import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/apiResponse.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, { statusCode: 401, message: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return errorResponse(res, { statusCode: 401, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};