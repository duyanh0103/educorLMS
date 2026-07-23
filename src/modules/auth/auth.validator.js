import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username tối thiểu 3 ký tự'),
  password: z.string().min(6, 'Password tối thiểu 6 ký tự'),
});