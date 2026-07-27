import { z } from 'zod';

export const createPlaylistSchema = z.object({
  title: z.string().min(2, 'Tiêu đề tối thiểu 2 ký tự'),
  order: z.number().int().optional(),
});

export const updatePlaylistSchema = z.object({
  title: z.string().min(2).optional(),
  order: z.number().int().optional(),
});

export const createVideoSchema = z.object({
  title: z.string().min(2, 'Tiêu đề tối thiểu 2 ký tự'),
  videoUrl: z.string().url('URL video không hợp lệ').refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Chỉ chấp nhận link YouTube' }
  ),
  duration: z.number().int().positive().optional(),
  order: z.number().int().optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(2).optional(),
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Chỉ chấp nhận link YouTube' }
  ).optional(),
  duration: z.number().int().positive().optional(),
  order: z.number().int().optional(),
});