import * as retakeRequestRepo from './retakeRequest.repository.js';
import * as submissionRepo from '../submission/submission.repository.js';
import * as examRepo from '../exam/exam.repository.js';
import * as classRepo from '../class/class.repository.js';
import { isTeacherAssignedToClass } from '../exam/exam.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const getOwnedSubmissionOrThrow = async (examId, submissionId, studentId) => {
  const submission = await submissionRepo.findSubmissionById(submissionId);
  if (!submission || submission.examId !== examId) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }
  if (submission.studentId !== studentId) {
    throw new AppError(403, 'Bạn không có quyền thao tác trên bài nộp này');
  }
  return submission;
};

const checkReviewerAccess = async (examId, requestUser) => {
  const exam = await examRepo.findExamById(examId);
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }
  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(exam.classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }
  return exam;
};

export const createRetakeRequest = async (examId, submissionId, { reason }, requestUser) => {
  const submission = await getOwnedSubmissionOrThrow(examId, submissionId, requestUser.id);

  if (submission.status === 'IN_PROGRESS') {
    throw new AppError(409, 'Bài đang làm dở, chưa cần yêu cầu làm lại');
  }

  const activeRequest = await retakeRequestRepo.findActiveRequestForSubmission(submissionId);
  if (activeRequest) {
    throw new AppError(409, 'Đã có yêu cầu đang chờ xử lý hoặc đã được duyệt cho bài nộp này');
  }

  return retakeRequestRepo.createRetakeRequest({
    examId, submissionId, studentId: requestUser.id, reason: reason ?? null,
  });
};

export const getMyRetakeRequest = async (examId, submissionId, requestUser) => {
  await getOwnedSubmissionOrThrow(examId, submissionId, requestUser.id);
  return retakeRequestRepo.findLatestRequestForSubmission(submissionId);
};

export const listRetakeRequestsByClass = async (classId, query, requestUser) => {
  const klass = await classRepo.findClassById(classId);
  if (!klass) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }
  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }

  const { page, limit, skip } = getPaginationParams(query);
  const { items, total } = await retakeRequestRepo.findRequestsByClass({
    classId, status: query.status, skip, take: limit,
  });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const approveRetakeRequest = async (requestId, requestUser) => {
  const request = await retakeRequestRepo.findRequestById(requestId);
  if (!request) {
    throw new AppError(404, 'Không tìm thấy yêu cầu làm lại');
  }
  await checkReviewerAccess(request.examId, requestUser);

  if (request.status !== 'PENDING') {
    throw new AppError(409, 'Yêu cầu đã được xử lý');
  }

  return retakeRequestRepo.updateRetakeRequest(requestId, {
    status: 'APPROVED',
    reviewedById: requestUser.id,
    reviewedAt: new Date(),
  });
};

export const rejectRetakeRequest = async (requestId, { reviewNote }, requestUser) => {
  const request = await retakeRequestRepo.findRequestById(requestId);
  if (!request) {
    throw new AppError(404, 'Không tìm thấy yêu cầu làm lại');
  }
  await checkReviewerAccess(request.examId, requestUser);

  if (request.status !== 'PENDING') {
    throw new AppError(409, 'Yêu cầu đã được xử lý');
  }

  return retakeRequestRepo.updateRetakeRequest(requestId, {
    status: 'REJECTED',
    reviewNote: reviewNote ?? null,
    reviewedById: requestUser.id,
    reviewedAt: new Date(),
  });
};
