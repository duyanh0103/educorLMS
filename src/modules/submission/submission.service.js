import * as submissionRepo from './submission.repository.js';
import * as examRepo from '../exam/exam.repository.js';
import * as questionRepo from '../question/question.repository.js';
import * as retakeRequestRepo from '../retakeRequest/retakeRequest.repository.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { AppError } from '../auth/auth.service.js';

// Gộp "lấy exam" + "kiểm tra quyền" thành 1 round-trip DB qua examRepo.findExamWithAccess thay vì
// 2 query tuần tự — xem giải thích chi tiết ở exam.repository.js#findExamWithAccess.
const checkExamAccess = async (examId, requestUser, { allowStudent = false } = {}) => {
  const exam = await examRepo.findExamWithAccess(examId, requestUser, { allowStudent });
  if (exam) return exam;

  const rawExam = await examRepo.findExamById(examId);
  if (!rawExam || rawExam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }
  if (requestUser.role === 'STUDENT' && !allowStudent) {
    throw new AppError(403, 'Không có quyền truy cập');
  }
  throw new AppError(
    403,
    requestUser.role === 'TEACHER' ? 'Bạn không phụ trách lớp học này' : 'Bạn chưa tham gia lớp học này'
  );
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
    const approvedRequest = await retakeRequestRepo.findApprovedRequestForSubmission(submission.id);
    if (!approvedRequest) {
      throw new AppError(409, 'Bạn đã nộp bài, chờ giáo viên mở lại để làm tiếp');
    }

    const maxAttempt = await submissionRepo.getMaxAttemptNumber(examId, studentId);
    const questions = await questionRepo.findQuestionsByExam(examId);
    submission = await submissionRepo.createSubmission({
      examId,
      studentId,
      attemptNumber: maxAttempt + 1,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      shuffleConfig: buildShuffleConfig(questions),
    });
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

// Cho Student tự tra bài nộp của mình theo examId, dùng khi POST /start trả 409
// (đã nộp bài từ phiên trước) mà FE chưa có sẵn submissionId để hiển thị điểm/kết quả.
export const getMySubmission = async (examId, requestUser) => {
  await checkExamAccess(examId, requestUser, { allowStudent: true });

  const submission = await submissionRepo.findLatestSubmission(examId, requestUser.id);
  if (!submission) {
    throw new AppError(404, 'Bạn chưa làm bài thi này');
  }

  const retakeRequest = await retakeRequestRepo.findLatestRequestForSubmission(submission.id);

  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    status: submission.status,
    score: submission.score,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt,
    gradedAt: submission.gradedAt,
    retakeRequest: retakeRequest
      ? { id: retakeRequest.id, status: retakeRequest.status, reason: retakeRequest.reason }
      : null,
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
  const { page, limit, skip } = getPaginationParams(query);

  // 1 round-trip duy nhất: exam + kiểm tra quyền + trang bài nộp + tổng số cùng lúc — xem
  // exam.repository.js#findExamWithAccessAndSubmissionsPage.
  const exam = await examRepo.findExamWithAccessAndSubmissionsPage(examId, requestUser, { skip, take: limit });
  if (!exam) {
    await checkExamAccess(examId, requestUser); // luôn throw đúng 404/403
  }

  const { submissions: items, _count } = exam;

  return { items, meta: buildPaginationMeta(_count.submissions, page, limit) };
};

export const getSubmissionById = async (id, requestUser) => {
  // 1 round-trip duy nhất: submission + exam + danh sách teacherId của lớp (đủ để kiểm tra quyền
  // TEACHER ngay tại chỗ), thay vì 3 query tuần tự (submission -> exam -> isTeacherAssignedToClass).
  const submission = await submissionRepo.findSubmissionWithExamAccess(id);
  if (!submission) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }

  const exam = submission.exam;
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = exam.class.teachers.some((t) => t.teacherId === requestUser.id);
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

  // Bỏ field `exam` (nested include chỉ dùng nội bộ để check quyền) khỏi response — giữ đúng
  // shape cũ, không lộ thêm field lạ ra API.
  const { exam: _exam, ...submissionFields } = submission;
  return { ...submissionFields, questions: questionsForResponse };
};

export const gradeSubmission = async (id, { manualScore }, requestUser) => {
  // 1 round-trip: submission + exam + teacherId của lớp, thay vì 3 query tuần tự.
  const submission = await submissionRepo.findSubmissionWithExamAccess(id);
  if (!submission) {
    throw new AppError(404, 'Không tìm thấy bài nộp');
  }

  const exam = submission.exam;
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = exam.class.teachers.some((t) => t.teacherId === requestUser.id);
    if (!isAssigned) {
      throw new AppError(403, 'Bạn không phụ trách lớp học này');
    }
  }

  // Cho phép chấm lại (status SUBMITTED hoặc GRADED) để sửa khi lỡ bấm nhầm/đọc thiếu -
  // chỉ chặn khi học sinh chưa nộp bài.
  if (submission.status === 'IN_PROGRESS') {
    throw new AppError(409, 'Học sinh chưa nộp bài, không thể chấm điểm');
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
