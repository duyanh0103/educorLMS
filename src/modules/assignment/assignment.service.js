import * as assignmentRepo from './assignment.repository.js';
import * as classRepo from '../class/class.repository.js';
import { isTeacherAssignedToClass, isStudentEnrolledInClass } from '../exam/exam.repository.js';
import { uploadBufferToCloudinary } from '../../config/cloudinary.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const checkClassAccess = async (classId, requestUser, { allowStudent = false } = {}) => {
  const classData = await classRepo.findClassById(classId);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  } else if (requestUser.role === 'STUDENT') {
    if (!allowStudent) {
      throw new AppError(403, 'Không có quyền truy cập');
    }
    const isEnrolled = await isStudentEnrolledInClass(classId, requestUser.id);
    if (!isEnrolled) {
      throw new AppError(403, 'Bạn chưa tham gia lớp học này');
    }
  }

  return classData;
};

const getAssignmentOr404 = async (id) => {
  const assignment = await assignmentRepo.findAssignmentById(id);
  if (!assignment || assignment.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài tập');
  }
  return assignment;
};

export const createAssignment = async (classId, data, requestUser) => {
  await checkClassAccess(classId, requestUser);

  return assignmentRepo.createAssignment({
    title: data.title,
    description: data.description,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    classId,
    creatorId: requestUser.id,
  });
};

export const listAssignmentsByClass = async (classId, requestUser) => {
  await checkClassAccess(classId, requestUser, { allowStudent: true });

  const onlyPublished = requestUser.role === 'STUDENT';
  return assignmentRepo.findAssignmentsByClass(classId, { onlyPublished });
};

export const getAssignmentById = async (id, requestUser) => {
  const assignment = await getAssignmentOr404(id);
  await checkClassAccess(assignment.classId, requestUser, { allowStudent: true });

  if (requestUser.role === 'STUDENT' && assignment.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài tập chưa được công bố');
  }

  return assignment;
};

export const updateAssignment = async (id, data, requestUser) => {
  const assignment = await getAssignmentOr404(id);
  await checkClassAccess(assignment.classId, requestUser);

  const updateData = { ...data };
  if (data.dueDate) {
    updateData.dueDate = new Date(data.dueDate);
  }

  return assignmentRepo.updateAssignment(id, updateData);
};

export const deleteAssignment = async (id, requestUser) => {
  const assignment = await getAssignmentOr404(id);
  await checkClassAccess(assignment.classId, requestUser);

  const submissionCount = await assignmentRepo.countSubmissionsByAssignment(id);
  if (submissionCount > 0) {
    throw new AppError(409, `Không thể xóa: đã có ${submissionCount} học sinh nộp bài`);
  }

  await assignmentRepo.deleteAssignment(id);
  return { id };
};

export const submitAssignment = async (assignmentId, { file, note }, requestUser) => {
  const assignment = await getAssignmentOr404(assignmentId);
  await checkClassAccess(assignment.classId, requestUser, { allowStudent: true });

  if (assignment.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài tập chưa được công bố');
  }

  if (!file) {
    throw new AppError(400, 'Vui lòng đính kèm file bài làm');
  }

  const { url } = await uploadBufferToCloudinary(file.buffer);
  const isLate = !!(assignment.dueDate && new Date() > new Date(assignment.dueDate));

  return assignmentRepo.upsertSubmission({
    assignmentId,
    studentId: requestUser.id,
    fileUrl: url,
    fileName: file.originalname,
    note,
    isLate,
  });
};

export const listSubmissionsByAssignment = async (assignmentId, query, requestUser) => {
  const assignment = await getAssignmentOr404(assignmentId);
  await checkClassAccess(assignment.classId, requestUser);

  const { page, limit, skip } = getPaginationParams(query);
  const { items, total } = await assignmentRepo.findSubmissionsByAssignment({ assignmentId, skip, take: limit });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getMySubmission = async (assignmentId, requestUser) => {
  const assignment = await getAssignmentOr404(assignmentId);
  await checkClassAccess(assignment.classId, requestUser, { allowStudent: true });

  return assignmentRepo.findSubmissionByStudent(assignmentId, requestUser.id);
};

export const gradeSubmission = async (id, { score, feedback }, requestUser) => {
  const submission = await assignmentRepo.findSubmissionById(id);
  if (!submission) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }

  const assignment = await getAssignmentOr404(submission.assignmentId);
  await checkClassAccess(assignment.classId, requestUser);

  return assignmentRepo.updateSubmissionGrade(id, {
    score,
    feedback,
    gradedById: requestUser.id,
    gradedAt: new Date(),
  });
};
