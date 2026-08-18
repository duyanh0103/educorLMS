import * as dashboardRepo from './dashboard.repository.js';

const ROLE_KEY_MAP = {
  SUPER_ADMIN: 'superAdmin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const getAdminDashboard = async () => {
  const raw = await dashboardRepo.getAdminRawStats();

  const byRole = { superAdmin: 0, teacher: 0, student: 0 };
  for (const group of raw.usersByRole) {
    const key = ROLE_KEY_MAP[group.role];
    if (key) byRole[key] = group._count;
  }

  return {
    users: {
      total: raw.usersTotal,
      byRole,
      active: raw.usersActive,
      inactive: raw.usersInactive,
    },
    courses: {
      total: raw.coursesTotal,
      active: raw.coursesActive,
      inactive: raw.coursesInactive,
    },
    classes: {
      total: raw.classesTotal,
      active: raw.classesActive,
      inactive: raw.classesInactive,
    },
    enrollments: {
      total: raw.enrollmentsTotal,
    },
    exams: {
      total: raw.examsTotal,
      draft: raw.examsDraft,
      published: raw.examsPublished,
      closed: raw.examsClosed,
      totalSubmissions: raw.examSubmissionsTotal,
      gradedSubmissions: raw.examSubmissionsGraded,
      submissionRate: raw.examSubmissionsTotal > 0
        ? Number((raw.examSubmissionsGraded / raw.examSubmissionsTotal).toFixed(4))
        : 0,
    },
    assignments: {
      total: raw.assignmentsTotal,
      draft: raw.assignmentsDraft,
      published: raw.assignmentsPublished,
      closed: raw.assignmentsClosed,
      totalSubmissions: raw.assignmentSubmissionsTotal,
      lateSubmissions: raw.assignmentSubmissionsLate,
      gradedSubmissions: raw.assignmentSubmissionsGraded,
    },
  };
};

export const getTeacherDashboard = async (teacherId) => {
  const classIds = await dashboardRepo.getTeacherClassIds(teacherId);

  const [classes, stats, todaySessions] = await Promise.all([
    dashboardRepo.getTeacherClasses(classIds),
    dashboardRepo.getTeacherRawStats(classIds),
    dashboardRepo.findTodaySessionsByTeacher(teacherId),
  ]);

  const todaySchedule = {
    count: todaySessions.length,
    sessions: todaySessions,
  };

  // Chỉ cần tra ngày sắp tới gần nhất khi hôm nay không có lịch nào — tránh 1 query thừa.
  const nextUpcomingDate = todaySessions.length === 0
    ? await dashboardRepo.findNextUpcomingDateByTeacher(teacherId)
    : null;

  return {
    classes: {
      total: classes.length,
      active: classes.filter((c) => c.isActive).length,
      inactive: classes.filter((c) => !c.isActive).length,
      list: classes.map((c) => ({
        id: c.id,
        name: c.name,
        courseName: c.course.title,
        studentCount: c._count.enrollments,
      })),
    },
    students: {
      totalUniqueStudents: stats.totalUniqueStudents,
    },
    exams: {
      total: stats.examsTotal,
      draft: stats.examsDraft,
      published: stats.examsPublished,
      pendingGrading: stats.examsPendingGrading,
    },
    assignments: {
      total: stats.assignmentsTotal,
      draft: stats.assignmentsDraft,
      published: stats.assignmentsPublished,
      pendingGrading: stats.assignmentsPendingGrading,
    },
    todaySchedule,
    nextUpcomingDate,
  };
};

export const getStudentDashboard = async (studentId) => {
  const [currentSessions, nextSession] = await Promise.all([
    dashboardRepo.findCurrentSessionsByStudent(studentId),
    dashboardRepo.findNextSessionByStudent(studentId),
  ]);

  return { currentSessions, nextSession };
};
