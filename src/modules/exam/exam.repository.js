import prisma from '../../config/prisma.js';

export const isTeacherAssignedToClass = async (classId, teacherId) => {
  const record = await prisma.classTeacher.findUnique({
    where: { classId_teacherId: { classId, teacherId } },
  });
  return !!record;
};

export const isStudentEnrolledInClass = async (classId, studentId) => {
  const record = await prisma.enrollment.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });
  return !!record;
};

export const createExam = async (data) => {
  return prisma.exam.create({ data });
};

export const findExamsByClass = async (classId, { onlyPublished = false } = {}) => {
  return prisma.exam.findMany({
    where: {
      classId,
      deletedAt: null,
      ...(onlyPublished && { status: 'PUBLISHED' }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      status: true,
      classId: true,
      createdAt: true,
      _count: { select: { questions: true } },
    },
  });
};

export const findExamById = async (id) => {
  return prisma.exam.findUnique({ where: { id } });
};

export const updateExam = async (id, data) => {
  return prisma.exam.update({ where: { id }, data });
};

export const countSubmissionsByExam = async (examId) => {
  return prisma.submission.count({ where: { examId } });
};

export const deleteExam = async (id) => {
  return prisma.$transaction([
    prisma.question.deleteMany({ where: { examId: id } }),
    prisma.exam.delete({ where: { id } }),
  ]);
};