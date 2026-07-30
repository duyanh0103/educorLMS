import { z } from 'zod';

export const createRetakeRequestSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export const rejectRetakeRequestSchema = z.object({
  reviewNote: z.string().trim().min(1).optional(),
});

export const listRetakeRequestQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
