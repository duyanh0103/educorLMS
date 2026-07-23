import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url('URL ảnh không hợp lệ').optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const listCourseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});