import prisma from '../../config/prisma.js';

export const createSession = async (data) => {
  return prisma.classSession.create({ data });
};

export const findSessionById = async (id) => {
  return prisma.classSession.findUnique({ where: { id } });
};

export const findSessionsByClass = async (classId, { from, to } = {}) => {
  return prisma.classSession.findMany({
    where: {
      classId,
      ...(from && { startAt: { gte: new Date(from) } }),
      ...(to && { endAt: { lte: new Date(to) } }),
    },
    orderBy: { startAt: 'asc' },
  });
};

export const updateSession = async (id, data) => {
  return prisma.classSession.update({ where: { id }, data });
};

export const deleteSession = async (id) => {
  return prisma.classSession.delete({ where: { id } });
};

// Toàn bộ teacherId đang phụ trách 1 Class
export const getClassTeacherIds = async (classId) => {
  const rows = await prisma.classTeacher.findMany({
    where: { classId },
    select: { teacherId: true },
  });
  return rows.map((r) => r.teacherId);
};

// Tìm các ClassSession (ở BẤT KỲ lớp nào) giao nhau về thời gian với [startAt, endAt],
// mà lớp đó có ít nhất 1 giáo viên nằm trong teacherIds đang phụ trách.
// excludeSessionId dùng khi update để loại trừ chính session đang sửa khỏi kết quả.
export const findConflictingSessions = async (teacherIds, startAt, endAt, excludeSessionId = null) => {
  if (!teacherIds || teacherIds.length === 0) return [];

  return prisma.classSession.findMany({
    where: {
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeSessionId && { id: { not: excludeSessionId } }),
      class: {
        teachers: { some: { teacherId: { in: teacherIds } } },
      },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          teachers: {
            where: { teacherId: { in: teacherIds } },
            select: { teacherId: true, teacher: { select: { id: true, fullName: true } } },
          },
        },
      },
    },
  });
};
