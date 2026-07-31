import { findUserByUsername, findUserById } from './auth.repository.js';
import { comparePassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const login = async ({ username, password }) => {
  const user = await findUserByUsername(username);

  if (!user) {
    throw new AppError(401, 'Username hoặc password không đúng');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Username hoặc password không đúng');
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(401, 'Không tìm thấy refresh token');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError(401, 'Refresh token không hợp lệ hoặc đã hết hạn');
  }

  const user = await findUserById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Tài khoản không tồn tại hoặc đã bị khóa');
  }

  // Refresh token phát hành trước lần đổi mật khẩu gần nhất -> coi như phiên cũ, thu hồi.
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new AppError(401, 'Mật khẩu đã được thay đổi, vui lòng đăng nhập lại');
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};

export const getMe = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, 'Không tìm thấy user');
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
  };
};

export { AppError };