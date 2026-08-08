import * as questionRepo from './question.repository.js';
import * as examRepo from '../exam/exam.repository.js';
import { AppError } from '../auth/auth.service.js';
import { extractQuestionsFromFile } from './parsers/fileExtractor.js';

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

const ensureExamIsDraft = (exam) => {
  if (exam.status !== 'DRAFT') {
    throw new AppError(409, 'Chỉ có thể thêm/sửa/xóa câu hỏi khi bài thi còn ở trạng thái DRAFT');
  }
};

const sanitizeQuestionForStudent = (question) => {
  const { correctAnswer, ...rest } = question;
  return rest;
};

export const createQuestion = async (examId, data, requestUser) => {
  const exam = await checkExamAccess(examId, requestUser);
  ensureExamIsDraft(exam);
  return questionRepo.createQuestion({ ...data, examId });
};

export const listQuestionsByExam = async (examId, requestUser) => {
  // 1 round-trip duy nhất: exam + kiểm tra quyền + danh sách câu hỏi cùng lúc (thay vì check quyền
  // xong mới query câu hỏi riêng) — xem exam.repository.js#findExamWithAccessAndQuestions.
  const exam = await examRepo.findExamWithAccessAndQuestions(examId, requestUser, { allowStudent: true });
  if (!exam) {
    await checkExamAccess(examId, requestUser, { allowStudent: true }); // luôn throw đúng 404/403
  }

  if (requestUser.role === 'STUDENT' && exam.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài thi chưa được công bố');
  }

  const { questions } = exam;

  // Student không được thấy correctAnswer
  if (requestUser.role === 'STUDENT') {
    return questions.map(sanitizeQuestionForStudent);
  }
  return questions;
};

const getQuestionWithExam = async (questionId) => {
  const question = await questionRepo.findQuestionById(questionId);
  if (!question) {
    throw new AppError(404, 'Không tìm thấy câu hỏi');
  }
  const exam = await examRepo.findExamById(question.examId);
  return { question, exam };
};

export const updateQuestion = async (questionId, data, requestUser) => {
  const { question, exam } = await getQuestionWithExam(questionId);
  await checkExamAccess(exam.id, requestUser);
  ensureExamIsDraft(exam);
  return questionRepo.updateQuestion(questionId, data);
};

export const deleteQuestion = async (questionId, requestUser) => {
  const { question, exam } = await getQuestionWithExam(questionId);
  await checkExamAccess(exam.id, requestUser);
  ensureExamIsDraft(exam);
  await questionRepo.deleteQuestion(questionId);
  return { id: questionId };
};

export const importQuestions = async (examId, file, requestUser) => {
  const exam = await checkExamAccess(examId, requestUser);
  ensureExamIsDraft(exam);

  if (!file) {
    throw new AppError(400, 'Vui lòng đính kèm file (.xlsx, .docx, hoặc .pdf)');
  }

  const { parsed, errors } = await extractQuestionsFromFile(file);

  const imported = [];
  for (const q of parsed) {
    const created = await questionRepo.createQuestion({ ...q, examId });
    imported.push(created);
  }

  return {
    importedCount: imported.length,
    imported,
    skipped: errors, // các câu bị lỗi định dạng, không import được
  };
};