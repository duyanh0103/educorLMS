import { Router } from 'express';
import {
  createPlaylistController, listPlaylistsController,
  updatePlaylistController, deletePlaylistController,
  createVideoController, updateVideoController, deleteVideoController,
} from './playlist.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createPlaylistSchema, updatePlaylistSchema, createVideoSchema, updateVideoSchema,
} from './playlist.validator.js';
import { ROLES } from '../../constants/roles.js';

// Router lồng trong /api/classes/:classId/playlists
export const classPlaylistRouter = Router({ mergeParams: true });

classPlaylistRouter.post(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createPlaylistSchema), createPlaylistController
);
classPlaylistRouter.get(
  '/', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  listPlaylistsController
);

// Router độc lập cho /api/playlists/:id và /api/videos/:id
export const playlistRouter = Router();

playlistRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updatePlaylistSchema), updatePlaylistController
);
playlistRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deletePlaylistController
);
playlistRouter.post(
  '/:playlistId/videos', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(createVideoSchema), createVideoController
);

export const videoRouter = Router();

videoRouter.patch(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  validate(updateVideoSchema), updateVideoController
);
videoRouter.delete(
  '/:id', authenticate, authorize([ROLES.SUPER_ADMIN, ROLES.TEACHER]),
  deleteVideoController
);