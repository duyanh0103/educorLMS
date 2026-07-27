import { errorResponse } from '../utils/apiResponse.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse(res, { statusCode: 422, message: 'Dữ liệu không hợp lệ', errors });
    }

    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse(res, { statusCode: 422, message: 'Query không hợp lệ', errors });
    }

    // Không gán lại req.query (Express 5 chặn), lưu vào property riêng
    req.validatedQuery = result.data;
    next();
  };
};