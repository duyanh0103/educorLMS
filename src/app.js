import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/user/user.route.js';
import courseRoutes from './modules/course/course.route.js';
import classRoutes from './modules/class/class.route.js';
import { classEnrollmentRouter, studentRouter } from './modules/enrollment/enrollment.route.js';
import { classPlaylistRouter, playlistRouter, videoRouter } from './modules/playlist/playlist.route.js';
import { classExamRouter, examRouter } from './modules/exam/exam.route.js';
import { examQuestionRouter, questionRouter } from './modules/question/question.route.js';
import { examSubmissionRouter, submissionRouter, examStudentRouter } from './modules/submission/submission.route.js';
import { examSubmissionRetakeRouter, classRetakeRequestRouter, retakeRequestRouter } from './modules/retakeRequest/retakeRequest.route.js';
import { classAssignmentRouter, assignmentRouter, assignmentSubmissionRouter } from './modules/assignment/assignment.route.js';
import { dashboardRouter } from './modules/dashboard/dashboard.route.js';
import { classSessionRouter, sessionRouter } from './modules/session/session.route.js';

// ...

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classes/:classId/enrollments', classEnrollmentRouter);
app.use('/api/students', studentRouter);

app.use('/api/classes/:classId/playlists', classPlaylistRouter);
app.use('/api/playlists', playlistRouter);
app.use('/api/videos', videoRouter);

app.use('/api/classes/:classId/exams', classExamRouter);
app.use('/api/exams', examRouter);

app.use('/api/exams/:examId/questions', examQuestionRouter);
app.use('/api/questions', questionRouter);

app.use('/api/exams/:examId/submissions', examSubmissionRouter);
app.use('/api/exams/:examId/submissions', examSubmissionRetakeRouter);
app.use('/api/submissions', submissionRouter);
app.use('/api/exams/:examId/students', examStudentRouter);

app.use('/api/classes/:classId/retake-requests', classRetakeRequestRouter);
app.use('/api/retake-requests', retakeRequestRouter);

app.use('/api/classes/:classId/assignments', classAssignmentRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/assignment-submissions', assignmentSubmissionRouter);

app.use('/api/dashboard', dashboardRouter);

app.use('/api/classes/:classId/sessions', classSessionRouter);
app.use('/api/sessions', sessionRouter);
export default app;