import * as enrollmentRepo from './enrollment.repository.js';
import * as classRepo from '../class/class.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const ensureClassAccess = async (classId, requestUser) => {
  const classData = await classRepo.findClassById(classId);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await enrollmentRepo.isTeacherAssignedToClass(classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }

  return classData;
};

export const enrollStudents = async (classId, { studentIds }, requestUser) => {
  await ensureClassAccess(classId, requestUser);

  const validStudents = await enrollmentRepo.findValidStudents(studentIds);
  const validIds = validStudents.map((s) => s.id);

  const existingEnrollments = await enrollmentRepo.findExistingEnrollments(classId, validIds);
  const existingIds = new Set(existingEnrollments.map((e) => e.studentId));

  const skipped = [];
  const toEnroll = [];

  for (const id of studentIds) {
    if (!validIds.includes(id)) {
      skipped.push({ studentId: id, reason: 'Không tồn tại hoặc không phải học sinh' });
    } else if (existingIds.has(id)) {
      skipped.push({ studentId: id, reason: 'Đã có trong lớp' });
    } else {
      toEnroll.push(id);
    }
  }

  if (toEnroll.length > 0) {
    await enrollmentRepo.createManyEnrollments(classId, toEnroll);
  }

  return { enrolled: toEnroll, skipped };
};

export const listClassEnrollments = async (classId, query, requestUser) => {
  await ensureClassAccess(classId, requestUser);

  const { page, limit, skip } = getPaginationParams(query);
  const { items, total } = await enrollmentRepo.findEnrollmentsByClass({ classId, skip, take: limit });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const unenrollStudent = async (classId, studentId, requestUser) => {
  await ensureClassAccess(classId, requestUser);

  const enrollment = await enrollmentRepo.findEnrollment(classId, studentId);
  if (!enrollment) {
    throw new AppError(404, 'Học sinh chưa có trong lớp này');
  }

  await enrollmentRepo.deleteEnrollment(classId, studentId);
  return { classId, studentId };
};

export const getMyClasses = async (studentId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { items, total } = await enrollmentRepo.findClassesByStudent({ studentId, skip, take: limit });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};