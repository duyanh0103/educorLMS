import prisma from '../../config/prisma.js';

const listInclude = {
  exam: { select: { id: true, title: true } },
  student: { select: { id: true, fullName: true, username: true } },
  submission: { select: { id: true, attemptNumber: true, score: true, status: true } },
};

export const createRetakeRequest = async ({ examId, submissionId, studentId, reason }) => {
  return prisma.examRetakeRequest.create({
    data: { examId, submissionId, studentId, reason },
  });
};

export const findActiveRequestForSubmission = async (submissionId) => {
  return prisma.examRetakeRequest.findFirst({
    where: { submissionId, status: { in: ['PENDING', 'APPROVED'] } },
  });
};

export const findApprovedRequestForSubmission = async (submissionId) => {
  return prisma.examRetakeRequest.findFirst({
    where: { submissionId, status: 'APPROVED' },
  });
};

export const findLatestRequestForSubmission = async (submissionId) => {
  return prisma.examRetakeRequest.findFirst({
    where: { submissionId },
    orderBy: { createdAt: 'desc' },
  });
};

export const findRequestById = async (id) => {
  return prisma.examRetakeRequest.findUnique({ where: { id } });
};

export const findRequestsByClass = async ({ classId, status, skip, take }) => {
  const where = {
    exam: { classId },
    ...(status && { status }),
  };

  const [items, total] = await Promise.all([
    prisma.examRetakeRequest.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' }, include: listInclude,
    }),
    prisma.examRetakeRequest.count({ where }),
  ]);
  return { items, total };
};

export const updateRetakeRequest = async (id, data) => {
  return prisma.examRetakeRequest.update({ where: { id }, data });
};
