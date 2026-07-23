import prisma from '../../config/prisma.js';

export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({ where: { username } });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};