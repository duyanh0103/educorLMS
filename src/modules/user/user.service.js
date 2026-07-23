import * as userRepo from './user.repository.js';
import { hashPassword } from '../../utils/password.js';
import { generateRandomPassword } from '../../utils/generatePassword.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const sanitizeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

export const createUser = async ({ username, fullName, email, role }) => {
  const existingUsername = await userRepo.findUserByUsername(username);
  if (existingUsername) {
    throw new AppError(409, 'Username đã tồn tại');
  }

  if (email) {
    const existingEmail = await userRepo.findUserByEmail(email);
    if (existingEmail) {
      throw new AppError(409, 'Email đã được sử dụng');
    }
  }

  const rawPassword = generateRandomPassword(10);
  const hashedPassword = await hashPassword(rawPassword);

  const user = await userRepo.createUser({
    username,
    fullName,
    email,
    role,
    password: hashedPassword,
    isActive: true,
  });

  return {
    user: sanitizeUser(user),
    initialPassword: rawPassword, // Chỉ trả về DUY NHẤT lần này
  };
};

export const listUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where = {
    deletedAt: null,
    ...(query.role && { role: query.role }),
    ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
    ...(query.search && {
      OR: [
        { username: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const { items, total } = await userRepo.findManyUsers({ where, skip, take: limit });

  return {
    items,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export const getUserById = async (id) => {
  const user = await userRepo.findUserById(id);
  if (!user || user.deletedAt) {
    throw new AppError(404, 'Không tìm thấy user');
  }
  return sanitizeUser(user);
};

export const updateUser = async (id, data) => {
  const user = await userRepo.findUserById(id);
  if (!user || user.deletedAt) {
    throw new AppError(404, 'Không tìm thấy user');
  }

  if (data.email && data.email !== user.email) {
    const existingEmail = await userRepo.findUserByEmail(data.email);
    if (existingEmail) {
      throw new AppError(409, 'Email đã được sử dụng');
    }
  }

  const updated = await userRepo.updateUser(id, data);
  return sanitizeUser(updated);
};

export const toggleActiveStatus = async (id, isActive) => {
  const user = await userRepo.findUserById(id);
  if (!user || user.deletedAt) {
    throw new AppError(404, 'Không tìm thấy user');
  }

  if (user.role === 'SUPER_ADMIN') {
    throw new AppError(403, 'Không thể khóa tài khoản Super Admin');
  }

  const updated = await userRepo.updateUser(id, { isActive });
  return sanitizeUser(updated);
};

export const resetPassword = async (id) => {
  const user = await userRepo.findUserById(id);
  if (!user || user.deletedAt) {
    throw new AppError(404, 'Không tìm thấy user');
  }

  const rawPassword = generateRandomPassword(10);
  const hashedPassword = await hashPassword(rawPassword);

  await userRepo.updateUser(id, { password: hashedPassword });

  return { newPassword: rawPassword }; // Chỉ trả về DUY NHẤT lần này
};