import prisma from '../../config/prisma.js';

const classInclude = {
  course: { select: { id: true, title: true } },
  teachers: {
    include: {
      teacher: { select: { id: true, fullName: true, username: true, email: true } },
    },
  },
  _count: { select: { enrollments: true } },
};

export const createClass = async ({ name, courseId, teacherIds, primaryTeacherId }) => {
  return prisma.class.create({
    data: {
      name,
      courseId,
      teachers: {
        create: teacherIds.map((teacherId) => ({
          teacherId,
          isPrimary: teacherId === primaryTeacherId,
        })),
      },
    },
    include: classInclude,
  });
};

export const findClassById = async (id) => {
  return prisma.class.findUnique({ where: { id }, include: classInclude });
};

export const findManyClasses = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.class.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: classInclude }),
    prisma.class.count({ where }),
  ]);
  return { items, total };
};

export const updateClass = async (id, data) => {
  return prisma.class.update({ where: { id }, data, include: classInclude });
};

export const replaceClassTeachers = async (classId, teacherIds, primaryTeacherId) => {
  return prisma.$transaction([
    prisma.classTeacher.deleteMany({ where: { classId } }),
    prisma.classTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        classId,
        teacherId,
        isPrimary: teacherId === primaryTeacherId,
      })),
    }),
  ]);
};

export const countEnrollmentsByClass = async (classId) => {
  return prisma.enrollment.count({ where: { classId } });
};

export const deleteClass = async (id) => {
  return prisma.$transaction([
    prisma.classTeacher.deleteMany({ where: { classId: id } }),
    prisma.class.delete({ where: { id } }),
  ]);
};

export const validateTeacherIds = async (teacherIds) => {
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds }, role: 'TEACHER', deletedAt: null },
    select: { id: true },
  });
  return teachers.map((t) => t.id);
};

export const validateCourseExists = async (courseId) => {
  return prisma.course.findUnique({ where: { id: courseId } });
};