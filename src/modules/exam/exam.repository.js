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

export const createExam = async (data) => {
  return prisma.exam.create({ data });
};

export const findExamsByClass = async (classId, { onlyPublished = false } = {}) => {
  return prisma.exam.findMany({
    where: {
      classId,
      deletedAt: null,
      ...(onlyPublished && { status: 'PUBLISHED' }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      status: true,
      classId: true,
      createdAt: true,
      _count: { select: { questions: true } },
    },
  });
};

export const findExamById = async (id) => {
  return prisma.exam.findUnique({ where: { id } });
};

// Mỗi round-trip tới Neon (us-east-1) tốn ~250-400ms — dồn 2-3 query tuần tự (fetch exam rồi kiểm
// tra quyền riêng) khiến các trang giáo viên hay dùng (câu hỏi, bài nộp) load chậm rõ rệt. Các hàm
// findExamWith* dưới đây gộp "lấy exam" + "kiểm tra quyền" (+ dữ liệu liên quan) thành 1 round-trip.
const examAccessFilter = (requestUser, { allowStudent = false } = {}) => {
  if (requestUser.role === 'STUDENT' && !allowStudent) return null; // chặn hẳn, khỏi cần query
  if (requestUser.role === 'TEACHER') return { class: { teachers: { some: { teacherId: requestUser.id } } } };
  if (requestUser.role === 'STUDENT') return { class: { enrollments: { some: { studentId: requestUser.id } } } };
  return {};
};

// Trả về null nếu không có quyền/không tồn tại — service layer tự query thêm 1 lần (chỉ trên
// nhánh lỗi, hiếm gặp) để phân biệt 404 vs 403 với message chính xác.
export const findExamWithAccess = async (examId, requestUser, options = {}) => {
  const roleFilter = examAccessFilter(requestUser, options);
  if (roleFilter === null) return null;
  return prisma.exam.findFirst({ where: { id: examId, deletedAt: null, ...roleFilter } });
};

// Cho listQuestionsByExam — gộp thêm danh sách câu hỏi vào cùng query.
export const findExamWithAccessAndQuestions = async (examId, requestUser, options = {}) => {
  const roleFilter = examAccessFilter(requestUser, options);
  if (roleFilter === null) return null;
  return prisma.exam.findFirst({
    where: { id: examId, deletedAt: null, ...roleFilter },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
};

// Cho listSubmissionsByExam — gộp thêm 1 trang bài nộp (phân trang) + tổng số vào cùng query.
export const findExamWithAccessAndSubmissionsPage = async (examId, requestUser, { skip, take, ...options }) => {
  const roleFilter = examAccessFilter(requestUser, options);
  if (roleFilter === null) return null;
  return prisma.exam.findFirst({
    where: { id: examId, deletedAt: null, ...roleFilter },
    include: {
      submissions: {
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { id: true, fullName: true, username: true } } },
      },
      _count: { select: { submissions: true } },
    },
  });
};

export const updateExam = async (id, data) => {
  return prisma.exam.update({ where: { id }, data });
};

export const countSubmissionsByExam = async (examId) => {
  return prisma.submission.count({ where: { examId } });
};

export const deleteExam = async (id) => {
  return prisma.$transaction([
    prisma.question.deleteMany({ where: { examId: id } }),
    prisma.exam.delete({ where: { id } }),
  ]);
};