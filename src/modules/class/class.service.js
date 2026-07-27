import * as classRepo from './class.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const validateTeachers = async (teacherIds, primaryTeacherId) => {
  const validIds = await classRepo.validateTeacherIds(teacherIds);
  const invalidIds = teacherIds.filter((id) => !validIds.includes(id));

  if (invalidIds.length > 0) {
    throw new AppError(400, `Các ID sau không phải giáo viên hợp lệ: ${invalidIds.join(', ')}`);
  }

  if (primaryTeacherId && !teacherIds.includes(primaryTeacherId)) {
    throw new AppError(400, 'primaryTeacherId phải nằm trong danh sách teacherIds');
  }
};

export const createClass = async ({ name, courseId, teacherIds, primaryTeacherId }, requestUser) => {
  const course = await classRepo.validateCourseExists(courseId);
  if (!course || course.deletedAt) {
    throw new AppError(404, 'Không tìm thấy khóa học');
  }

  let finalTeacherIds;
  let finalPrimaryTeacherId;

  if (requestUser.role === 'TEACHER') {
    // Teacher tự tạo lớp -> tự động gán chính họ, bỏ qua teacherIds nếu có gửi lên
    finalTeacherIds = [requestUser.id];
    finalPrimaryTeacherId = requestUser.id;
  } else {
    // SUPER_ADMIN -> bắt buộc phải truyền teacherIds
    if (!teacherIds || teacherIds.length === 0) {
      throw new AppError(400, 'Cần chọn ít nhất 1 giáo viên phụ trách');
    }
    await validateTeachers(teacherIds, primaryTeacherId);
    finalTeacherIds = teacherIds;
    finalPrimaryTeacherId = primaryTeacherId;
  }

  return classRepo.createClass({ name, courseId, teacherIds: finalTeacherIds, primaryTeacherId: finalPrimaryTeacherId });
};

export const listClasses = async (query, requestUser) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where = {
    deletedAt: null,
    ...(query.courseId && { courseId: query.courseId }),
    ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
    ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    // Teacher chỉ thấy lớp mình phụ trách (khóa cứng theo requestUser.id, bỏ qua query.teacherId);
    // Admin thấy hết, hoặc filter theo teacherId nếu truyền vào
    ...(requestUser.role === 'TEACHER'
      ? { teachers: { some: { teacherId: requestUser.id } } }
      : query.teacherId
        ? { teachers: { some: { teacherId: query.teacherId } } }
        : {}),
  };

  const { items, total } = await classRepo.findManyClasses({ where, skip, take: limit });
  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getClassById = async (id, requestUser) => {
  const classData = await classRepo.findClassById(id);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = classData.teachers.some((t) => t.teacherId === requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }

  return classData;
};

export const updateClass = async (id, data) => {
  const classData = await classRepo.findClassById(id);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }
  return classRepo.updateClass(id, data);
};

export const updateClassTeachers = async (id, { teacherIds, primaryTeacherId }) => {
  const classData = await classRepo.findClassById(id);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  await validateTeachers(teacherIds, primaryTeacherId);
  await classRepo.replaceClassTeachers(id, teacherIds, primaryTeacherId);

  return classRepo.findClassById(id);
};

export const deleteClass = async (id) => {
  const classData = await classRepo.findClassById(id);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  const enrollmentCount = await classRepo.countEnrollmentsByClass(id);
  if (enrollmentCount > 0) {
    throw new AppError(409, `Không thể xóa: lớp học đang có ${enrollmentCount} học sinh`);
  }

  await classRepo.deleteClass(id);
  return { id };
};