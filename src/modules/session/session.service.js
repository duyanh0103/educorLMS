import crypto from 'crypto';
import * as sessionRepo from './session.repository.js';
import * as classRepo from '../class/class.repository.js';
import { isTeacherAssignedToClass, isStudentEnrolledInClass } from '../exam/exam.repository.js';
import { AppError } from '../auth/auth.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const checkClassAccess = async (classId, requestUser, { allowStudent = false } = {}) => {
  const classData = await classRepo.findClassById(classId);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  } else if (requestUser.role === 'STUDENT') {
    if (!allowStudent) {
      throw new AppError(403, 'Không có quyền truy cập');
    }
    const isEnrolled = await isStudentEnrolledInClass(classId, requestUser.id);
    if (!isEnrolled) {
      throw new AppError(403, 'Bạn chưa tham gia lớp học này');
    }
  }

  return classData;
};

const buildConflictDetails = (conflictingSessions) => {
  const details = [];
  for (const session of conflictingSessions) {
    for (const ct of session.class.teachers) {
      details.push({
        teacherId: ct.teacherId,
        teacherName: ct.teacher.fullName,
        conflictingSessionId: session.id,
        conflictingClassName: session.class.name,
        conflictingStartAt: session.startAt,
        conflictingEndAt: session.endAt,
      });
    }
  }
  return details;
};

const checkScheduleConflict = async (classId, startAt, endAt, excludeSessionId = null) => {
  const teacherIds = await sessionRepo.getClassTeacherIds(classId);
  const conflictingSessions = await sessionRepo.findConflictingSessions(teacherIds, startAt, endAt, excludeSessionId);
  return buildConflictDetails(conflictingSessions);
};

const conflictError = (conflicts) => {
  const err = new AppError(409, 'Trùng lịch giáo viên với buổi học khác');
  err.details = conflicts;
  return err;
};

const combineDateAndTime = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00.000Z`);

export const createSession = async (classId, data, requestUser) => {
  await checkClassAccess(classId, requestUser);

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  const conflicts = await checkScheduleConflict(classId, startAt, endAt);
  if (conflicts.length > 0) {
    throw conflictError(conflicts);
  }

  return sessionRepo.createSession({
    classId,
    title: data.title,
    startAt,
    endAt,
    isMakeup: data.isMakeup || false,
    scheduleGroupId: null,
    createdById: requestUser.id,
  });
};

export const createRecurringSessions = async (classId, data, requestUser) => {
  await checkClassAccess(classId, requestUser);

  const { daysOfWeek, startTime, endTime, startDate, endDate, title } = data;
  const scheduleGroupId = crypto.randomUUID();

  const candidates = [];
  let cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      const dateStr = cursor.toISOString().slice(0, 10);
      candidates.push({
        date: dateStr,
        startAt: combineDateAndTime(dateStr, startTime),
        endAt: combineDateAndTime(dateStr, endTime),
      });
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  const created = [];
  const skipped = [];

  for (const candidate of candidates) {
    const conflicts = await checkScheduleConflict(classId, candidate.startAt, candidate.endAt);
    if (conflicts.length > 0) {
      skipped.push({ date: candidate.date, reason: 'Trùng lịch giáo viên với buổi học khác', conflictDetail: conflicts });
      continue;
    }

    const session = await sessionRepo.createSession({
      classId,
      title,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      isMakeup: false,
      scheduleGroupId,
      createdById: requestUser.id,
    });
    created.push(session);
  }

  return { createdCount: created.length, created, skipped };
};

export const listSessionsByClass = async (classId, query, requestUser) => {
  await checkClassAccess(classId, requestUser, { allowStudent: true });
  return sessionRepo.findSessionsByClass(classId, { from: query.from, to: query.to });
};

export const updateSession = async (id, data, requestUser) => {
  const session = await sessionRepo.findSessionById(id);
  if (!session) {
    throw new AppError(404, 'Không tìm thấy buổi học');
  }
  await checkClassAccess(session.classId, requestUser);

  const updateData = { ...data };

  if (data.startAt || data.endAt) {
    const newStartAt = data.startAt ? new Date(data.startAt) : session.startAt;
    const newEndAt = data.endAt ? new Date(data.endAt) : session.endAt;

    if (newEndAt <= newStartAt) {
      throw new AppError(422, 'endAt phải sau startAt');
    }

    const conflicts = await checkScheduleConflict(session.classId, newStartAt, newEndAt, id);
    if (conflicts.length > 0) {
      throw conflictError(conflicts);
    }

    updateData.startAt = newStartAt;
    updateData.endAt = newEndAt;
  }

  return sessionRepo.updateSession(id, updateData);
};

export const deleteSession = async (id, requestUser) => {
  const session = await sessionRepo.findSessionById(id);
  if (!session) {
    throw new AppError(404, 'Không tìm thấy buổi học');
  }
  await checkClassAccess(session.classId, requestUser);

  await sessionRepo.deleteSession(id);
  return { id };
};
