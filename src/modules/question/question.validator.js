import { z } from 'zod';

const optionSchema = z.object({
  key: z.string(),
  text: z.string(),
  imageUrl: z.string().url().optional(),
});

export const createQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'ESSAY', 'CODE']),
  content: z.string().min(3, 'Nội dung câu hỏi tối thiểu 3 ký tự'),
  contentImageUrl: z.string().url().optional(),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  score: z.number().positive().default(1),
  order: z.number().int().optional(),
  difficultyLevel: z.string().optional(),
  skillTag: z.string().optional(),
}).refine(
  (data) => data.type !== 'MULTIPLE_CHOICE' || (data.options && data.options.length >= 2),
  { message: 'Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn', path: ['options'] }
).refine(
  (data) => data.type !== 'MULTIPLE_CHOICE' || !!data.correctAnswer,
  { message: 'Câu hỏi trắc nghiệm cần chỉ định đáp án đúng', path: ['correctAnswer'] }
);

export const updateQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'ESSAY', 'CODE']).optional(),
  content: z.string().min(3).optional(),
  contentImageUrl: z.string().url().optional(),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  score: z.number().positive().optional(),
  order: z.number().int().optional(),
  difficultyLevel: z.string().optional(),
  skillTag: z.string().optional(),
});