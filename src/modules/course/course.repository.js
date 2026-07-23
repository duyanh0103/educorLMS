import prisma from '../../config/prisma.js';

export const createCourse = async (data) => {
  return prisma.course.create({ data });
};

export const findCourseById = async (id) => {
  return prisma.course.findUnique({ where: { id } });
};

export const findManyCourses = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { classes: true, playlists: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);
  return { items, total };
};

export const updateCourse = async (id, data) => {
  return prisma.course.update({ where: { id }, data });
};

export const countClassesByCourse = async (courseId) => {
  return prisma.class.count({ where: { courseId } });
};

export const deleteCourse = async (id) => {
  return prisma.course.delete({ where: { id } });
};