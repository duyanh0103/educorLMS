import * as playlistRepo from './playlist.repository.js';
import * as classRepo from '../class/class.repository.js';
import { AppError } from '../auth/auth.service.js';

const ensureClassAccess = async (classId, requestUser, { allowStudent = false } = {}) => {
  const classData = await classRepo.findClassById(classId);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await playlistRepo.isTeacherAssignedToClass(classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  } else if (requestUser.role === 'STUDENT') {
    if (!allowStudent) {
      throw new AppError(403, 'Không có quyền truy cập');
    }
    const isEnrolled = await playlistRepo.isStudentEnrolledInClass(classId, requestUser.id);
    if (!isEnrolled) {
      throw new AppError(403, 'Bạn chưa tham gia lớp học này');
    }
  }

  return classData;
};

// Playlist thuộc Class -> lấy classId từ Playlist để check quyền cho các thao tác PATCH/DELETE Playlist/Video
const ensurePlaylistAccess = async (playlistId, requestUser) => {
  const playlist = await playlistRepo.findPlaylistById(playlistId);
  if (!playlist) {
    throw new AppError(404, 'Không tìm thấy playlist');
  }
  await ensureClassAccess(playlist.classId, requestUser);
  return playlist;
};

// ===== PLAYLIST =====

export const createPlaylist = async (classId, data, requestUser) => {
  await ensureClassAccess(classId, requestUser);
  return playlistRepo.createPlaylist({ ...data, classId });
};

export const listPlaylistsByClass = async (classId, requestUser) => {
  await ensureClassAccess(classId, requestUser, { allowStudent: true });
  return playlistRepo.findPlaylistsByClass(classId);
};

export const updatePlaylist = async (id, data, requestUser) => {
  await ensurePlaylistAccess(id, requestUser);
  return playlistRepo.updatePlaylist(id, data);
};

export const deletePlaylist = async (id, requestUser) => {
  await ensurePlaylistAccess(id, requestUser);
  await playlistRepo.deletePlaylist(id);
  return { id };
};

// ===== VIDEO =====

export const createVideo = async (playlistId, data, requestUser) => {
  const playlist = await ensurePlaylistAccess(playlistId, requestUser);
  return playlistRepo.createVideo({ ...data, playlistId: playlist.id });
};

export const updateVideo = async (id, data, requestUser) => {
  const video = await playlistRepo.findVideoById(id);
  if (!video) {
    throw new AppError(404, 'Không tìm thấy video');
  }
  await ensureClassAccess(video.playlist.classId, requestUser);
  return playlistRepo.updateVideo(id, data);
};

export const deleteVideo = async (id, requestUser) => {
  const video = await playlistRepo.findVideoById(id);
  if (!video) {
    throw new AppError(404, 'Không tìm thấy video');
  }
  await ensureClassAccess(video.playlist.classId, requestUser);
  await playlistRepo.deleteVideo(id);
  return { id };
};