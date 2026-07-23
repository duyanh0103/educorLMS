import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username tối thiểu 3 ký tự').max(30),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional(),
  role: z.enum(['TEACHER', 'STUDENT'], { message: 'Role phải là TEACHER hoặc STUDENT' }),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
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