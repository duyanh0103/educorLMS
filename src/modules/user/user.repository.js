import prisma from '../../config/prisma.js';

export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({ where: { username } });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

export const createUser = async (data) => {
  return prisma.user.create({ data });
};

export const updateUser = async (id, data) => {
  return prisma.user.update({ where: { id }, data });
};

export const findAllUsernames = async () => {
  const rows = await prisma.user.findMany({ select: { username: true } });
  return rows.map((r) => r.username);
};

export const findUsersByEmails = async (emails) => {
  return prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } });
};

export const findManyUsers = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
};