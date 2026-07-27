import * as playlistService from './playlist.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const handleError = (res, err) => {
  return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message || 'Lỗi hệ thống' });
};

export const createPlaylistController = async (req, res) => {
  try {
    const playlist = await playlistService.createPlaylist(req.params.classId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Tạo playlist thành công', data: playlist });
  } catch (err) {
    return handleError(res, err);
  }
};

export const listPlaylistsController = async (req, res) => {
  try {
    const playlists = await playlistService.listPlaylistsByClass(req.params.classId, req.user);
    return successResponse(res, { message: 'Lấy danh sách thành công', data: playlists });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updatePlaylistController = async (req, res) => {
  try {
    const playlist = await playlistService.updatePlaylist(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật thành công', data: playlist });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deletePlaylistController = async (req, res) => {
  try {
    const result = await playlistService.deletePlaylist(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa playlist thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};

export const createVideoController = async (req, res) => {
  try {
    const video = await playlistService.createVideo(req.params.playlistId, req.body, req.user);
    return successResponse(res, { statusCode: 201, message: 'Thêm video thành công', data: video });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateVideoController = async (req, res) => {
  try {
    const video = await playlistService.updateVideo(req.params.id, req.body, req.user);
    return successResponse(res, { message: 'Cập nhật video thành công', data: video });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteVideoController = async (req, res) => {
  try {
    const result = await playlistService.deleteVideo(req.params.id, req.user);
    return successResponse(res, { message: 'Xóa video thành công', data: result });
  } catch (err) {
    return handleError(res, err);
  }
};