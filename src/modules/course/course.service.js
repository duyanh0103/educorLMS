import * as courseRepo from './course.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

export const createCourse = async (data) => {
  return courseRepo.createCourse(data);
};

export const listCourses = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where = {
    deletedAt: null,
    ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
    ...(query.search && {
      title: { contains: query.search, mode: 'insensitive' },
    }),
  };

  const { items, total } = await courseRepo.findManyCourses({ where, skip, take: limit });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getCourseById = async (id) => {
  const course = await courseRepo.findCourseById(id);
  if (!course || course.deletedAt) {
    throw new AppError(404, 'Không tìm thấy khóa học');
  }
  return course;
};

export const updateCourse = async (id, data) => {
  const course = await courseRepo.findCourseById(id);
  if (!course || course.deletedAt) {
    throw new AppError(404, 'Không tìm thấy khóa học');
  }
  return courseRepo.updateCourse(id, data);
};

export const deleteCourse = async (id) => {
  const course = await courseRepo.findCourseById(id);
  if (!course || course.deletedAt) {
    throw new AppError(404, 'Không tìm thấy khóa học');
  }

  const classCount = await courseRepo.countClassesByCourse(id);
  if (classCount > 0) {
    throw new AppError(409, `Không thể xóa: khóa học đang được sử dụng bởi ${classCount} lớp học`);
  }

  await courseRepo.deleteCourse(id);
  return { id };
};