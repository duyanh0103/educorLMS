import cloudinary from '../config/cloudinary.js';

// Nhận base64 data URI ("data:image/png;base64,...") hoặc Buffer + mimetype.
// Dùng chung cho Upload Module (Phần 3) và các parser import (Phần 6-8, ảnh nhúng trong docx).
export async function uploadImageToCloudinary(base64DataUriOrBuffer, mimetype) {
  const dataUri = typeof base64DataUriOrBuffer === 'string'
    ? base64DataUriOrBuffer
    : `data:${mimetype};base64,${base64DataUriOrBuffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'lms/images',
    resource_type: 'image',
  });
  return result.secure_url;
}
