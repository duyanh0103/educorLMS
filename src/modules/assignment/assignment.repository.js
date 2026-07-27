import prisma from '../../config/prisma.js';

const studentSelect = { id: true, fullName: true, username: true };

export const createAssignment = async (data) => {
  return prisma.assignment.create({ data });
};

export const findAssignmentsByClass = async (classId, { onlyPublished = false } = {}) => {
  return prisma.assignment.findMany({
    where: {
      classId,
      deletedAt: null,
      ...(onlyPublished && { status: 'PUBLISHED' }),
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findAssignmentById = async (id) => {
  return prisma.assignment.findUnique({ where: { id } });
};

export const updateAssignment = async (id, data) => {
  return prisma.assignment.update({ where: { id }, data });
};

export const countSubmissionsByAssignment = async (assignmentId) => {
  return prisma.assignmentSubmission.count({ where: { assignmentId } });
};

export const deleteAssignment = async (id) => {
  return prisma.assignment.delete({ where: { id } });
};

export const upsertSubmission = async ({ assignmentId, studentId, fileUrl, fileName, note, isLate }) => {
  return prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: { assignmentId, studentId, fileUrl, fileName, note, isLate },
    update: {
      fileUrl,
      fileName,
      note,
      isLate,
      submittedAt: new Date(),
      score: null,
      feedback: null,
      gradedById: null,
      gradedAt: null,
    },
  });
};

export const findSubmissionByStudent = async (assignmentId, studentId) => {
  return prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
};

export const findSubmissionsByAssignment = async ({ assignmentId, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      skip,
      take,
      orderBy: { submittedAt: 'desc' },
      include: { student: { select: studentSelect } },
    }),
    prisma.assignmentSubmission.count({ where: { assignmentId } }),
  ]);
  return { items, total };
};

export const findSubmissionById = async (id) => {
  return prisma.assignmentSubmission.findUnique({
    where: { id },
    include: { student: { select: studentSelect } },
  });
};

export const updateSubmissionGrade = async (id, data) => {
  return prisma.assignmentSubmission.update({ where: { id }, data });
};
