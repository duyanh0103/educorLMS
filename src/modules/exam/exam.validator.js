import { z } from 'zod';

export const createExamSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('Thời gian làm bài phải lớn hơn 0'),
});

export const updateExamSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
});