import { uploadImageToCloudinary } from '../../utils/uploadImage.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const uploadImageController = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, { statusCode: 400, message: 'Vui lòng chọn file ảnh' });
    }
    const url = await uploadImageToCloudinary(req.file.buffer, req.file.mimetype);
    return successResponse(res, { statusCode: 201, message: 'Upload ảnh thành công', data: { url } });
  } catch (err) {
    return errorResponse(res, { statusCode: 500, message: 'Upload ảnh thất bại' });
  }
};
