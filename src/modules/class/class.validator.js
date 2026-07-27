import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp tối thiểu 2 ký tự'),
  courseId: z.string().uuid('courseId không hợp lệ'),
  // teacherIds giờ optional — bắt buộc với SUPER_ADMIN, bỏ qua với TEACHER (tự động gán chính họ)
  teacherIds: z.array(z.string().uuid()).optional(),
  primaryTeacherId: z.string().uuid().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export const updateClassTeachersSchema = z.object({
  teacherIds: z.array(z.string().uuid()).min(1, 'Cần ít nhất 1 giáo viên'),
  primaryTeacherId: z.string().uuid().optional(),
});

export const listClassQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  courseId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});