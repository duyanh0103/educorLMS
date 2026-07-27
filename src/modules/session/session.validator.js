import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createRecurringSchema = z
  .object({
    daysOfWeek: z
      .array(z.number().int().min(0, 'daysOfWeek chỉ nhận giá trị 0-6').max(6, 'daysOfWeek chỉ nhận giá trị 0-6'))
      .min(1, 'Cần ít nhất 1 ngày trong tuần')
      .refine((arr) => new Set(arr).size === arr.length, { message: 'daysOfWeek không được trùng lặp' }),
    startTime: z.string().regex(timeRegex, 'startTime phải có định dạng HH:mm'),
    endTime: z.string().regex(timeRegex, 'endTime phải có định dạng HH:mm'),
    startDate: z.string().regex(dateRegex, 'startDate phải có định dạng YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'endDate phải có định dạng YYYY-MM-DD'),
    title: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, { message: 'endTime phải sau startTime', path: ['endTime'] })
  .refine((data) => data.endDate >= data.startDate, { message: 'endDate phải >= startDate', path: ['endDate'] });

export const createSingleSessionSchema = z
  .object({
    startAt: z.string().datetime('startAt phải là chuỗi ISO datetime hợp lệ'),
    endAt: z.string().datetime('endAt phải là chuỗi ISO datetime hợp lệ'),
    title: z.string().optional(),
    isMakeup: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'endAt phải sau startAt',
    path: ['endAt'],
  });

export const updateSessionSchema = z
  .object({
    title: z.string().optional(),
    startAt: z.string().datetime('startAt phải là chuỗi ISO datetime hợp lệ').optional(),
    endAt: z.string().datetime('endAt phải là chuỗi ISO datetime hợp lệ').optional(),
  })
  .refine(
    (data) => !(data.startAt && data.endAt) || new Date(data.endAt) > new Date(data.startAt),
    { message: 'endAt phải sau startAt', path: ['endAt'] }
  );

export const listSessionQuerySchema = z.object({
  from: z.string().datetime('from phải là chuỗi ISO datetime hợp lệ').optional(),
  to: z.string().datetime('to phải là chuỗi ISO datetime hợp lệ').optional(),
});
