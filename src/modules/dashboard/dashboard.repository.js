import prisma from '../../config/prisma.js';

export const getAdminRawStats = async () => {
  // Trước đây đây là 24 query Prisma riêng lẻ trong 1 $transaction — mỗi query là
  // 1 round-trip network tới DB. Với DB ở xa (~250-300ms RTT), tổng thời gian load
  // dashboard admin lên tới 6-11s. Gộp thành 1 câu SQL duy nhất (subquery COUNT
  // theo từng cột) để chỉ tốn đúng 1 round-trip.
  const rows = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users_total,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'SUPER_ADMIN') AS users_super_admin,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'TEACHER') AS users_teacher,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'STUDENT') AS users_student,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND is_active) AS users_active,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND NOT is_active) AS users_inactive,
      (SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL) AS courses_total,
      (SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL AND is_active) AS courses_active,
      (SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL AND NOT is_active) AS courses_inactive,
      (SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL) AS classes_total,
      (SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL AND is_active) AS classes_active,
      (SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL AND NOT is_active) AS classes_inactive,
      (SELECT COUNT(*) FROM enrollments) AS enrollments_total,
      (SELECT COUNT(*) FROM exams WHERE deleted_at IS NULL) AS exams_total,
      (SELECT COUNT(*) FROM exams WHERE deleted_at IS NULL AND status = 'DRAFT') AS exams_draft,
      (SELECT COUNT(*) FROM exams WHERE deleted_at IS NULL AND status = 'PUBLISHED') AS exams_published,
      (SELECT COUNT(*) FROM exams WHERE deleted_at IS NULL AND status = 'CLOSED') AS exams_closed,
      (SELECT COUNT(*) FROM submissions WHERE status IN ('SUBMITTED', 'GRADING', 'GRADED')) AS exam_submissions_total,
      (SELECT COUNT(*) FROM submissions WHERE status = 'GRADED') AS exam_submissions_graded,
      (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL) AS assignments_total,
      (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL AND status = 'DRAFT') AS assignments_draft,
      (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL AND status = 'PUBLISHED') AS assignments_published,
      (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL AND status = 'CLOSED') AS assignments_closed,
      (SELECT COUNT(*) FROM assignment_submissions) AS assignment_submissions_total,
      (SELECT COUNT(*) FROM assignment_submissions WHERE is_late) AS assignment_submissions_late,
      (SELECT COUNT(*) FROM assignment_submissions WHERE score IS NOT NULL) AS assignment_submissions_graded
  `;

  const r = rows[0];
  const toNum = (v) => Number(v);

  return {
    usersTotal: toNum(r.users_total),
    usersByRole: [
      { role: 'SUPER_ADMIN', _count: toNum(r.users_super_admin) },
      { role: 'TEACHER', _count: toNum(r.users_teacher) },
      { role: 'STUDENT', _count: toNum(r.users_student) },
    ],
    usersActive: toNum(r.users_active),
    usersInactive: toNum(r.users_inactive),
    coursesTotal: toNum(r.courses_total),
    coursesActive: toNum(r.courses_active),
    coursesInactive: toNum(r.courses_inactive),
    classesTotal: toNum(r.classes_total),
    classesActive: toNum(r.classes_active),
    classesInactive: toNum(r.classes_inactive),
    enrollmentsTotal: toNum(r.enrollments_total),
    examsTotal: toNum(r.exams_total),
    examsDraft: toNum(r.exams_draft),
    examsPublished: toNum(r.exams_published),
    examsClosed: toNum(r.exams_closed),
    examSubmissionsTotal: toNum(r.exam_submissions_total),
    examSubmissionsGraded: toNum(r.exam_submissions_graded),
    assignmentsTotal: toNum(r.assignments_total),
    assignmentsDraft: toNum(r.assignments_draft),
    assignmentsPublished: toNum(r.assignments_published),
    assignmentsClosed: toNum(r.assignments_closed),
    assignmentSubmissionsTotal: toNum(r.assignment_submissions_total),
    assignmentSubmissionsLate: toNum(r.assignment_submissions_late),
    assignmentSubmissionsGraded: toNum(r.assignment_submissions_graded),
  };
};

export const getTeacherClassIds = async (teacherId) => {
  const rows = await prisma.classTeacher.findMany({
    where: { teacherId },
    select: { classId: true },
  });
  return rows.map((r) => r.classId);
};

export const getTeacherClasses = async (classIds) => {
  return prisma.class.findMany({
    where: { id: { in: classIds }, deletedAt: null },
    select: {
      id: true,
      name: true,
      isActive: true,
      course: { select: { title: true } },
      _count: { select: { enrollments: true } },
    },
  });
};

export const getTeacherRawStats = async (classIds) => {
  // Gộp 9 query tuần tự (1 findMany + 8 count) thành 1 round-trip duy nhất — cùng
  // lý do như getAdminRawStats ở trên.
  const rows = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE class_id = ANY(${classIds})) AS total_unique_students,
      (SELECT COUNT(*) FROM exams WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL) AS exams_total,
      (SELECT COUNT(*) FROM exams WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL AND status = 'DRAFT') AS exams_draft,
      (SELECT COUNT(*) FROM exams WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL AND status = 'PUBLISHED') AS exams_published,
      (SELECT COUNT(*) FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.class_id = ANY(${classIds}) AND s.status = 'SUBMITTED') AS exams_pending_grading,
      (SELECT COUNT(*) FROM assignments WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL) AS assignments_total,
      (SELECT COUNT(*) FROM assignments WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL AND status = 'DRAFT') AS assignments_draft,
      (SELECT COUNT(*) FROM assignments WHERE class_id = ANY(${classIds}) AND deleted_at IS NULL AND status = 'PUBLISHED') AS assignments_published,
      (SELECT COUNT(*) FROM assignment_submissions asub JOIN assignments a ON asub.assignment_id = a.id WHERE a.class_id = ANY(${classIds}) AND asub.score IS NULL) AS assignments_pending_grading
  `;

  const r = rows[0];
  const toNum = (v) => Number(v);

  return {
    totalUniqueStudents: toNum(r.total_unique_students),
    examsTotal: toNum(r.exams_total),
    examsDraft: toNum(r.exams_draft),
    examsPublished: toNum(r.exams_published),
    examsPendingGrading: toNum(r.exams_pending_grading),
    assignmentsTotal: toNum(r.assignments_total),
    assignmentsDraft: toNum(r.assignments_draft),
    assignmentsPublished: toNum(r.assignments_published),
    assignmentsPendingGrading: toNum(r.assignments_pending_grading),
  };
};
