import { z } from 'zod';

export const submitAnswersSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export const gradeSubmissionSchema = z.object({
  manualScore: z.number().min(0, 'manualScore không được âm'),
});

export const listSubmissionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
