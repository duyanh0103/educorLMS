import { Router } from 'express';
import { uploadImageController } from './upload.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { uploadImageFile } from '../../config/multerImage.js';
import { errorResponse } from '../../utils/apiResponse.js';

const router = Router();

// Middleware xử lý lỗi Multer riêng (giống pattern question.route.js) vì multer throw lỗi
// khác định dạng response chuẩn của hệ thống.
const handleMulterImageUpload = (req, res, next) => {
  uploadImageFile(req, res, (err) => {
    if (err) {
      return errorResponse(res, { statusCode: 400, message: err.message });
    }
    next();
  });
};

router.post(
  '/image', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  handleMulterImageUpload, uploadImageController
);

export default router;
