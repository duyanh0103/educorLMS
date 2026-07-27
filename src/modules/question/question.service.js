import * as questionRepo from './question.repository.js';
import * as examRepo from '../exam/exam.repository.js';
import * as classRepo from '../class/class.repository.js';
import { AppError } from '../auth/auth.service.js';
import { extractQuestionsFromFile } from './parsers/fileExtractor.js';

const ensureExamWriteAccess = async (examId, requestUser) => {
  const exam = await examRepo.findExamById(examId);
  if (!exam || exam.deletedAt) {
    throw new AppError(404, 'Không tìm thấy bài thi');
  }

  const classData = await classRepo.findClassById(exam.classId);
  if (!classData || classData.deletedAt) {
    throw new AppError(404, 'Không tìm thấy lớp học');
  }

  if (requestUser.role === 'TEACHER') {
    const isAssigned = await examRepo.isTeacherAssignedToClass?.(exam.classId, requestUser.id)
      ?? (await import('../class/class.repository.js')).isTeacherAssignedByIds?.(exam.classId, requestUser.id);
    // fallback: dùng lại hàm đã có ở exam.repository.js
  }

  return exam;
};

// Dùng lại đúng helper đã có sẵn từ exam.repository.js để tránh trùng logic
import { isTeacherAssignedToClass, isStudentEnrolledInClass } from '../exam/exam.repository.js';

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
  const exam = await checkExamAccess(examId, requestUser, { allowStudent: true });

  if (requestUser.role === 'STUDENT' && exam.status !== 'PUBLISHED') {
    throw new AppError(403, 'Bài thi chưa được công bố');
  }

  const questions = await questionRepo.findQuestionsByExam(examId);

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