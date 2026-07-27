import prisma from '../../config/prisma.js';

const studentSelect = { id: true, fullName: true, username: true };

export const createSubmission = async (data) => {
  return prisma.submission.create({ data });
};

export const updateSubmission = async (id, data) => {
  return prisma.submission.update({ where: { id }, data });
};

// Attempt có attemptNumber lớn nhất cho (examId, studentId) - đại diện cho attempt hiện hành
export const findLatestSubmission = async (examId, studentId) => {
  return prisma.submission.findFirst({
    where: { examId, studentId },
    orderBy: { attemptNumber: 'desc' },
  });
};

export const findInProgressSubmission = async (examId, studentId) => {
  return prisma.submission.findFirst({
    where: { examId, studentId, status: 'IN_PROGRESS' },
    orderBy: { attemptNumber: 'desc' },
  });
};

export const findSubmissionById = async (id) => {
  return prisma.submission.findUnique({
    where: { id },
    include: { student: { select: studentSelect } },
  });
};

export const findSubmissionsByExam = async ({ examId, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where: { examId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: studentSelect } },
    }),
    prisma.submission.count({ where: { examId } }),
  ]);
  return { items, total };
};

export const hasSubmittedOrGraded = async (examId, studentId) => {
  const count = await prisma.submission.count({
    where: { examId, studentId, status: { in: ['SUBMITTED', 'GRADED'] } },
  });
  return count > 0;
};

export const getMaxAttemptNumber = async (examId, studentId) => {
  const result = await prisma.submission.aggregate({
    where: { examId, studentId },
    _max: { attemptNumber: true },
  });
  return result._max.attemptNumber || 0;
};
