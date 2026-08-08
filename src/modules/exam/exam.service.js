import * as examRepo from './exam.repository.js';
import * as classRepo from '../class/class.repository.js';
import { AppError } from '../auth/auth.service.js';

const ensureClassAccess = async (classId, requestUser, { allowStudent = false } = {}) => {
  const classData = await classRepo.findClassWithAccess(classId, requestUser, { allowStudent });
  if (classData) return classData;

  // Không có quyền (hoặc không tồn tại) — query lại (không lọc quyền) chỉ để phân biệt đúng
  // 404 vs 403, nhánh này hiếm khi chạy nên không ảnh hưởng hiệu năng đường thường công.
  const rawClass = await classRepo.findClassById(classId);
  if (!rawClass || rawClass.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }
  if (requestUser.role === 'STUDENT' && !allowStudent) {
    throw new AppError(403, 'Không có quyền truy cập');
  }
  throw new AppError(
    403,
    requestUser.role === 'TEACHER' ? 'Bạn không phụ trách lớp học này' : 'Bạn chưa tham gia lớp học này'
  );
};

export const createExam = async (classId, data, requestUser) => {
  await ensureClassAccess(classId, requestUser);
  return examRepo.createExam({ ...data, classId, creatorId: requestUser.id });
};

export const listExamsByClass = async (classId, requestUser) => {
  await ensureClassAccess(classId, requestUser, { allowStudent: true });
  // Student chỉ thấy Exam PUBLISHED; Admin/Teacher thấy tất cả (kể cả DRAFT, CLOSED)
  const onlyPublished = requestUser.role === 'STUDENT';
  return examRepo.findExamsByClass(classId, { onlyPublished });
};

const ensureExamAccess = async (examId, requestUser, { allowStudent = false } = {}) => {
  const exam = await examRepo.findExamWithAccess(examId, requestUser, { allowStudent });
  if (exam) return exam;

  // Không có quyền (hoặc không tồn tại) — query lại (không lọc quyền) chỉ để phân biệt đúng
  // 404 vs 403, nhánh này hiếm khi chạy nên không ảnh hưởng hiệu năng đường thường công.
  const rawExam = await examRepo.findExamById(examId);
  if (!rawExam || rawExam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }
  if (requestUser.role === 'STUDENT' && !allowStudent) {
    throw new AppError(403, 'Không có quyền truy cập');
  }
  throw new AppError(
    403,
    requestUser.role === 'TEACHER' ? 'Bạn không phụ trách lớp học này' : 'Bạn chưa tham gia lớp học này'
  );
};

export const getExamById = async (examId, requestUser) => {
  const exam = await ensureExamAccess(examId, requestUser, { allowStudent: true });

  if (requestUser.role === 'STUDENT' && exam.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài thi chưa được công bố');
  }

  return exam;
};

export const updateExam = async (examId, data, requestUser) => {
  await ensureExamAccess(examId, requestUser);
  return examRepo.updateExam(examId, data);
};

export const deleteExam = async (examId, requestUser) => {
  await ensureExamAccess(examId, requestUser);

  const submissionCount = await examRepo.countSubmissionsByExam(examId);
  if (submissionCount > 0) {
    throw new AppError(409, `Không thể xóa: đã có ${submissionCount} học sinh nộp bài`);
  }

  await examRepo.deleteExam(examId);
  return { id: examId };
};