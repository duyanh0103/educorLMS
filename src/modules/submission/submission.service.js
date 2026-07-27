import * as submissionRepo from './submission.repository.js';
import * as examRepo from '../exam/exam.repository.js';
import * as questionRepo from '../question/question.repository.js';
import { isTeacherAssignedToClass, isStudentEnrolledInClass } from '../exam/exam.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

const checkExamAccess = async (examId, requestUser, { allowStudent = false } = {}) => {
  const exam = await examRepo.findExamById(examId);
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(exam.classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  } else if (requestUser.role === 'STUDENT') {
    if (!allowStudent) {
      throw new AppError(403, 'Không có quyền truy cập');
    }
    const isEnrolled = await isStudentEnrolledInClass(exam.classId, requestUser.id);
    if (!isEnrolled) {
      throw new AppError(403, 'Bạn chưa tham gia lớp học này');
    }
  }

  return exam;
};

const sanitizeQuestionForStudent = (question) => {
  const { correctAnswer, ...rest } = question;
  return rest;
};

const shuffleArray = (arr) => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const buildShuffleConfig = (questions) => {
  const questionOrder = shuffleArray(questions.map((q) => q.id));

  const optionOrders = {};
  for (const q of questions) {
    if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options)) {
      optionOrders[q.id] = shuffleArray(q.options.map((o) => o.key));
    }
  }

  return { questionOrder, optionOrders };
};

const applyShuffle = (questions, shuffleConfig) => {
  if (!shuffleConfig) {
    return questions;
  }

  const byId = new Map(questions.map((q) => [q.id, q]));
  const orderedIds = shuffleConfig.questionOrder || [];
  const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
  const orderedSet = new Set(ordered.map((q) => q.id));
  const remaining = questions.filter((q) => !orderedSet.has(q.id));
  const finalList = [...ordered, ...remaining];

  return finalList.map((q) => {
    const optionOrder = shuffleConfig.optionOrders?.[q.id];
    if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && optionOrder) {
      const byKey = new Map(q.options.map((o) => [o.key, o]));
      const newOptions = optionOrder.map((key) => byKey.get(key)).filter(Boolean);
      return { ...q, options: newOptions };
    }
    return q;
  });
};

export const startSubmission = async (examId, requestUser) => {
  const exam = await checkExamAccess(examId, requestUser, { allowStudent: true });
  if (exam.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài thi chưa được công bố');
  }

  const studentId = requestUser.id;
  let submission = await submissionRepo.findLatestSubmission(examId, studentId);

  if (!submission) {
    submission = await submissionRepo.createSubmission({
      examId,
      studentId,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });
  } else if (submission.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'Bạn đã nộp bài, chờ giáo viên mở lại để làm tiếp');
  } else if (!submission.startedAt) {
    const updateData = { startedAt: new Date() };
    if (submission.attemptNumber > 1) {
      const questions = await questionRepo.findQuestionsByExam(examId);
      updateData.shuffleConfig = buildShuffleConfig(questions);
    }
    submission = await submissionRepo.updateSubmission(submission.id, updateData);
  }

  const questions = await questionRepo.findQuestionsByExam(examId);
  const shuffledQuestions = applyShuffle(questions, submission.shuffleConfig);

  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    startedAt: submission.startedAt,
    durationMinutes: exam.durationMinutes,
    questions: shuffledQuestions.map(sanitizeQuestionForStudent),
  };
};

export const submitSubmission = async (examId, { answers }, requestUser) => {
  const exam = await checkExamAccess(examId, requestUser, { allowStudent: true });
  const studentId = requestUser.id;

  const submission = await submissionRepo.findInProgressSubmission(examId, studentId);
  if (!submission) {
    throw new AppError(404, 'Bạn chưa bắt đầu làm bài');
  }

  const elapsedMinutes = (Date.now() - new Date(submission.startedAt).getTime()) / 60000;
  if (elapsedMinutes > exam.durationMinutes) {
    throw new AppError(409, 'Đã hết giờ làm bài, không thể nộp bài');
  }

  const questions = await questionRepo.findQuestionsByExam(examId);

  let autoScore = 0;
  let hasEssayOrCode = false;
  for (const q of questions) {
    if (q.type === 'MULTIPLE_CHOICE') {
      if (answers[q.id] && answers[q.id] === q.correctAnswer) {
        autoScore += q.score;
      }
    } else {
      hasEssayOrCode = true;
    }
  }

  const updateData = {
    answers,
    autoScore,
    submittedAt: new Date(),
  };

  if (!hasEssayOrCode) {
    updateData.status = 'GRADED';
    updateData.score = autoScore;
    updateData.gradedAt = new Date();
  } else {
    updateData.status = 'SUBMITTED';
    updateData.score = null;
  }

  return submissionRepo.updateSubmission(submission.id, updateData);
};

export const listSubmissionsByExam = async (examId, query, requestUser) => {
  await checkExamAccess(examId, requestUser);

  const { page, limit, skip } = getPaginationParams(query);
  const { items, total } = await submissionRepo.findSubmissionsByExam({ examId, skip, take: limit });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getSubmissionById = async (id, requestUser) => {
  const submission = await submissionRepo.findSubmissionById(id);
  if (!submission) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }

  const exam = await examRepo.findExamById(submission.examId);
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(exam.classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  } else if (requestUser.role === 'STUDENT' && submission.studentId !== requestUser.id) {
    throw new AppError(403, 'Bạn không có quyền xem bài nộp này');
  }

  const questions = await questionRepo.findQuestionsByExam(exam.id);
  const shuffledQuestions = applyShuffle(questions, submission.shuffleConfig);

  const hideCorrectAnswer = requestUser.role === 'STUDENT' && submission.status !== 'GRADED';
  const questionsForResponse = hideCorrectAnswer
    ? shuffledQuestions.map(sanitizeQuestionForStudent)
    : shuffledQuestions;

  return { ...submission, questions: questionsForResponse };
};

export const gradeSubmission = async (id, { manualScore }, requestUser) => {
  const submission = await submissionRepo.findSubmissionById(id);
  if (!submission) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }

  const exam = await examRepo.findExamById(submission.examId);
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await isTeacherAssignedToClass(exam.classId, requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }

  if (submission.status !== 'SUBMITTED') {
    throw new AppError(409, 'Bài đã được chấm');
  }

  const autoScore = submission.autoScore || 0;

  return submissionRepo.updateSubmission(id, {
    manualScore,
    score: autoScore + manualScore,
    status: 'GRADED',
    gradedById: requestUser.id,
    gradedAt: new Date(),
  });
};

export const reopenSubmission = async (examId, studentId, requestUser) => {
  await checkExamAccess(examId, requestUser);

  const hasSubmitted = await submissionRepo.hasSubmittedOrGraded(examId, studentId);
  if (!hasSubmitted) {
    throw new AppError(400, 'Học sinh chưa làm bài lần nào, không cần mở lại');
  }

  const maxAttempt = await submissionRepo.getMaxAttemptNumber(examId, studentId);

  return submissionRepo.createSubmission({
    examId,
    studentId,
    attemptNumber: maxAttempt + 1,
    status: 'IN_PROGRESS',
    startedAt: null,
    shuffleConfig: null,
  });
};
