import * as userRepo from './user.repository.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateRandomPassword } from '../../utils/generatePassword.js';
import { buildUsernameBase, resolveUniqueUsernames } from '../../utils/generateUsername.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Best-effort giống enrollStudents/importQuestions: dòng lỗi bị skip kèm lý do,
// không chặn toàn bộ request. username không nhận từ client, luôn tự sinh (xem generateUsername.js).
export const createUsersBulk = async (rows) => {
  const skipped = [];
  const validRows = [];

  rows.forEach((raw, idx) => {
    const row = idx + 1;
    const fullName = typeof raw.fullName === 'string' ? raw.fullName.trim() : '';
    const role = raw.role;
    const email = raw.email === null || raw.email === undefined || raw.email === ''
      ? undefined
      : raw.email;

    if (fullName.length < 2) {
      skipped.push({ row, fullName: typeof raw.fullName === 'string' ? raw.fullName : null, reason: 'Họ tên thiếu hoặc quá ngắn (tối thiểu 2 ký tự)' });
      return;
    }
    if (role !== 'TEACHER' && role !== 'STUDENT') {
      skipped.push({ row, fullName, reason: 'Role không hợp lệ (chỉ nhận TEACHER hoặc STUDENT)' });
      return;
    }
    if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email))) {
      skipped.push({ row, fullName, reason: 'Email không hợp lệ' });
      return;
    }

    validRows.push({ row, fullName, role, email });
  });

  // Check trùng email: vừa với DB, vừa giữa các dòng trong cùng batch
  const candidateEmails = validRows.filter((r) => r.email).map((r) => r.email);
  const existingByEmail = candidateEmails.length > 0
    ? await userRepo.findUsersByEmails(candidateEmails)
    : [];
  const existingEmailSet = new Set(existingByEmail.map((u) => u.email));

  const seenEmailsInBatch = new Set();
  const finalRows = [];
  for (const r of validRows) {
    if (r.email) {
      if (existingEmailSet.has(r.email) || seenEmailsInBatch.has(r.email)) {
        skipped.push({ row: r.row, fullName: r.fullName, reason: 'Email đã được sử dụng' });
        continue;
      }
      seenEmailsInBatch.add(r.email);
    }
    finalRows.push(r);
  }

  const created = [];
  if (finalRows.length > 0) {
    const existingUsernames = await userRepo.findAllUsernames();
    const bases = finalRows.map((r) => buildUsernameBase(r.fullName));
    const usernames = resolveUniqueUsernames(bases, existingUsernames);

    for (let i = 0; i < finalRows.length; i++) {
      const r = finalRows[i];
      const username = usernames[i];
      const rawPassword = generateRandomPassword(10);
      const hashedPassword = await hashPassword(rawPassword);

      const user = await userRepo.createUser({
        username,
        fullName: r.fullName,
        email: r.email,
        role: r.role,
        password: hashedPassword,
        isActive: true,
      });

      created.push({ row: r.row, user: sanitizeUser(user), initialPassword: rawPassword });
    }
  }

  skipped.sort((a, b) => a.row - b.row);

  return {
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped,
  };
};

export const listUsers = async (query, requestUser) => {
  const { page, limit, skip } = getPaginationParams(query);

  // TEACHER chỉ được dùng endpoint này để tìm học sinh (vd. dialog ghi danh),
  // không được liệt kê SUPER_ADMIN/TEACHER khác -> ép cứng role=STUDENT.
  const roleFilter = requestUser?.role === 'TEACHER' ? 'STUDENT' : query.role;

  const where = {
    deletedAt: null,
    ...(roleFilter && { role: roleFilter }),
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

// User tự đổi mật khẩu của chính mình (khác resetPassword ở trên - đó là SUPER_ADMIN reset hộ).
// Set passwordChangedAt để refreshAccessToken thu hồi các refresh token phát hành trước đó
// (xem auth.service.js) - giới hạn rủi ro token cũ bị lộ còn dùng được xuống dưới 15 phút
// (thời hạn access token) thay vì suốt 7 ngày (thời hạn refresh token).
export const changeMyPassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userRepo.findUserById(userId);
  if (!user || user.deletedAt) {
    throw new AppError(404, 'Không tìm thấy user');
  }

  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Mật khẩu cũ không đúng');
  }

  const hashedPassword = await hashPassword(newPassword);
  await userRepo.updateUser(userId, { password: hashedPassword, passwordChangedAt: new Date() });

  return null;
};