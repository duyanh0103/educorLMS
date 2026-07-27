import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  description: z.string().optional(),
  dueDate: z.string().datetime('dueDate phải là chuỗi ISO datetime hợp lệ').optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime('dueDate phải là chuỗi ISO datetime hợp lệ').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
});

export const gradeAssignmentSubmissionSchema = z.object({
  score: z.number().min(0, 'score không được âm'),
  feedback: z.string().optional(),
});

export const listSubmissionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
