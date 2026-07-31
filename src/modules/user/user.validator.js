import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username tối thiểu 3 ký tự').max(30),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional(),
  role: z.enum(['TEACHER', 'STUDENT'], { message: 'Role phải là TEACHER hoặc STUDENT' }),
});

// Validate lỏng ở tầng route: chỉ chặn sai shape tổng thể (không phải mảng, rỗng, quá 200 dòng).
// Validate nội dung từng dòng (fullName/role/email) làm ở service theo mô hình best-effort —
// dòng lỗi bị skip kèm lý do, không làm fail toàn bộ request.
export const bulkCreateUsersSchema = z.object({
  users: z.array(z.record(z.string(), z.unknown()))
    .min(1, 'Cần ít nhất 1 dòng')
    .max(200, 'Tối đa 200 dòng mỗi lần'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

// Rule độ mạnh: chỉ tối thiểu 8 ký tự, không bắt buộc hoa/số/ký tự đặc biệt — nhất quán với
// mức validate đơn giản đang dùng toàn hệ thống (không nơi nào khác ép rule mật khẩu phức tạp).
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
}).refine((data) => data.newPassword !== data.oldPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu cũ',
  path: ['newPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export const listUserQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'TEACHER', 'STUDENT']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});