import * as authService from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

export const loginController = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, {
      message: 'Đăng nhập thành công',
      data: { accessToken, user },
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Lỗi hệ thống',
    });
  }
};

export const refreshController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);

    return successResponse(res, {
      message: 'Refresh token thành công',
      data: { accessToken },
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Lỗi hệ thống',
    });
  }
};

export const logoutController = async (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  return successResponse(res, { message: 'Đăng xuất thành công' });
};

export const meController = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, { message: 'Lấy thông tin thành công', data: user });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Lỗi hệ thống',
    });
  }
};