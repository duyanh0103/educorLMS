import prisma from '../../config/prisma.js';

export const getAdminRawStats = async () => {
  const [
    usersTotal,
    usersByRole,
    usersActive,
    usersInactive,
    coursesTotal,
    coursesActive,
    coursesInactive,
    classesTotal,
    classesActive,
    classesInactive,
    enrollmentsTotal,
    examsTotal,
    examsDraft,
    examsPublished,
    examsClosed,
    examSubmissionsTotal,
    examSubmissionsGraded,
    assignmentsTotal,
    assignmentsDraft,
    assignmentsPublished,
    assignmentsClosed,
    assignmentSubmissionsTotal,
    assignmentSubmissionsLate,
    assignmentSubmissionsGraded,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.groupBy({ by: ['role'], _count: true, where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.user.count({ where: { deletedAt: null, isActive: false } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null, isActive: true } }),
    prisma.course.count({ where: { deletedAt: null, isActive: false } }),
    prisma.class.count({ where: { deletedAt: null } }),
    prisma.class.count({ where: { deletedAt: null, isActive: true } }),
    prisma.class.count({ where: { deletedAt: null, isActive: false } }),
    prisma.enrollment.count(),
    prisma.exam.count({ where: { deletedAt: null } }),
    prisma.exam.count({ where: { deletedAt: null, status: 'DRAFT' } }),
    prisma.exam.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    prisma.exam.count({ where: { deletedAt: null, status: 'CLOSED' } }),
    prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'GRADING', 'GRADED'] } } }),
    prisma.submission.count({ where: { status: 'GRADED' } }),
    prisma.assignment.count({ where: { deletedAt: null } }),
    prisma.assignment.count({ where: { deletedAt: null, status: 'DRAFT' } }),
    prisma.assignment.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    prisma.assignment.count({ where: { deletedAt: null, status: 'CLOSED' } }),
    prisma.assignmentSubmission.count(),
    prisma.assignmentSubmission.count({ where: { isLate: true } }),
    prisma.assignmentSubmission.count({ where: { score: { not: null } } }),
  ]);

  return {
    usersTotal,
    usersByRole,
    usersActive,
    usersInactive,
    coursesTotal,
    coursesActive,
    coursesInactive,
    classesTotal,
    classesActive,
    classesInactive,
    enrollmentsTotal,
    examsTotal,
    examsDraft,
    examsPublished,
    examsClosed,
    examSubmissionsTotal,
    examSubmissionsGraded,
    assignmentsTotal,
    assignmentsDraft,
    assignmentsPublished,
    assignmentsClosed,
    assignmentSubmissionsTotal,
    assignmentSubmissionsLate,
    assignmentSubmissionsGraded,
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
  const [
    distinctStudentRows,
    examsTotal,
    examsDraft,
    examsPublished,
    examsPendingGrading,
    assignmentsTotal,
    assignmentsDraft,
    assignmentsPublished,
    assignmentsPendingGrading,
  ] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { classId: { in: classIds } },
      distinct: ['studentId'],
      select: { studentId: true },
    }),
    prisma.exam.count({ where: { classId: { in: classIds }, deletedAt: null } }),
    prisma.exam.count({ where: { classId: { in: classIds }, deletedAt: null, status: 'DRAFT' } }),
    prisma.exam.count({ where: { classId: { in: classIds }, deletedAt: null, status: 'PUBLISHED' } }),
    prisma.submission.count({ where: { status: 'SUBMITTED', exam: { classId: { in: classIds } } } }),
    prisma.assignment.count({ where: { classId: { in: classIds }, deletedAt: null } }),
    prisma.assignment.count({ where: { classId: { in: classIds }, deletedAt: null, status: 'DRAFT' } }),
    prisma.assignment.count({ where: { classId: { in: classIds }, deletedAt: null, status: 'PUBLISHED' } }),
    prisma.assignmentSubmission.count({ where: { score: null, assignment: { classId: { in: classIds } } } }),
  ]);

  return {
    totalUniqueStudents: distinctStudentRows.length,
    examsTotal,
    examsDraft,
    examsPublished,
    examsPendingGrading,
    assignmentsTotal,
    assignmentsDraft,
    assignmentsPublished,
    assignmentsPendingGrading,
  };
};
