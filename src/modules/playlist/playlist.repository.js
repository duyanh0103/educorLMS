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

export const createPlaylist = async (data) => {
  return prisma.playlist.create({ data });
};

export const findPlaylistsByClass = async (classId) => {
  return prisma.playlist.findMany({
    where: { classId },
    orderBy: { order: 'asc' },
    include: { videos: { orderBy: { order: 'asc' } } },
  });
};

export const findPlaylistById = async (id) => {
  return prisma.playlist.findUnique({
    where: { id },
    include: { videos: { orderBy: { order: 'asc' } }, class: true },
  });
};

export const updatePlaylist = async (id, data) => {
  return prisma.playlist.update({ where: { id }, data });
};

export const deletePlaylist = async (id) => {
  return prisma.$transaction([
    prisma.playlistVideo.deleteMany({ where: { playlistId: id } }),
    prisma.playlist.delete({ where: { id } }),
  ]);
};

export const createVideo = async (data) => {
  return prisma.playlistVideo.create({ data });
};

export const findVideoById = async (id) => {
  return prisma.playlistVideo.findUnique({
    where: { id },
    include: { playlist: { include: { class: true } } },
  });
};

export const updateVideo = async (id, data) => {
  return prisma.playlistVideo.update({ where: { id }, data });
};

export const deleteVideo = async (id) => {
  return prisma.playlistVideo.delete({ where: { id } });
};