import { z } from 'zod';

export const enrollStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid('studentId không hợp lệ')).min(1, 'Cần ít nhất 1 học sinh'),
});

export const listEnrollmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});