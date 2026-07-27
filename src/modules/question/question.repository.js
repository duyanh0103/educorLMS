import prisma from '../../config/prisma.js';

export const createQuestion = async (data) => {
  return prisma.question.create({ data });
};

export const findQuestionsByExam = async (examId) => {
  return prisma.question.findMany({
    where: { examId },
    orderBy: { order: 'asc' },
  });
};

export const findQuestionById = async (id) => {
  return prisma.question.findUnique({ where: { id } });
};

export const updateQuestion = async (id, data) => {
  return prisma.question.update({ where: { id }, data });
};

export const deleteQuestion = async (id) => {
  return prisma.question.delete({ where: { id } });
};