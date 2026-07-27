import prisma from '../../config/prisma.js';

export const isTeacherAssignedToClass = async (classId, teacherId) => {
  const record = await prisma.classTeacher.findUnique({
    where: { classId_teacherId: { classId, teacherId } },
  });
  return !!record;
};

export const findValidStudents = async (studentIds) => {
  return prisma.user.findMany({
    where: { id: { in: studentIds }, role: 'STUDENT', deletedAt: null },
    select: { id: true },
  });
};

export const findExistingEnrollments = async (classId, studentIds) => {
  return prisma.enrollment.findMany({
    where: { classId, studentId: { in: studentIds } },
    select: { studentId: true },
  });
};

export const createManyEnrollments = async (classId, studentIds) => {
  return prisma.enrollment.createMany({
    data: studentIds.map((studentId) => ({ classId, studentId, status: 'ACTIVE' })),
  });
};

export const findEnrollmentsByClass = async ({ classId, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, fullName: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.enrollment.count({ where: { classId } }),
  ]);
  return { items, total };
};

export const findEnrollment = async (classId, studentId) => {
  return prisma.enrollment.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });
};

export const deleteEnrollment = async (classId, studentId) => {
  return prisma.enrollment.delete({
    where: { studentId_classId: { studentId, classId } },
  });
};

export const findClassesByStudent = async ({ studentId, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            isActive: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.enrollment.count({ where: { studentId } }),
  ]);
  return { items, total };
};