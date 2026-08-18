# CLAUDE.md — Ngữ cảnh dự án LMS Backend (EduCore / MindX Checkpoint)

> File này được Claude Code tự động đọc mỗi khi làm việc trong project. Luôn cập nhật file này sau khi hoàn thành 1 bước/tính năng mới, để không cần quét lại toàn bộ codebase mỗi lần bắt đầu phiên làm việc mới.

## 1. Tổng quan

Backend LMS cho MindX Technology School — hệ thống quản lý lớp học (courses, classes, exams, assignments...) với 3 vai trò: SUPER_ADMIN, TEACHER, STUDENT.

## 2. Tech Stack (đã chốt, KHÔNG đổi trừ khi có lý do rất rõ ràng)

- Node.js ES Modules, JavaScript thuần — **KHÔNG dùng TypeScript**
- Express 5 (lưu ý: `req.query` là getter-only, không gán trực tiếp `req.query = ...`)
- **Prisma 6** (KHÔNG dùng Prisma 7 — lý do: Prisma 7 generator mặc định sinh code TypeScript thuần, xung đột với yêu cầu "không TypeScript" của dự án. Đã downgrade 1 lần, đừng nâng cấp lại nếu không có kế hoạch xử lý vấn đề này)
- PostgreSQL trên Neon — có 2 branch: `production` (Render dùng) và `local`/`development` (máy dev dùng riêng, tách biệt hoàn toàn, không tự đồng bộ)
- JWT (access token 15 phút, refresh token 7 ngày qua httpOnly cookie)
- Zod validate (lưu ý: Zod v4 dùng `.issues` không phải `.errors` trên `ZodError`)
- bcrypt hash password
- Multer (memoryStorage) + Cloudinary (upload ảnh/file)
- Kiến trúc: Clean Architecture module-first — mỗi module trong `src/modules/<name>/` có đủ `route/controller/service/repository/validator`

## 3. Trạng thái tiến độ (theo lộ trình 20 bước gốc)

### Đã hoàn thành

| Bước | Module | Ghi chú quan trọng |
|---|---|---|
| 1-3 | Khởi tạo project, cấu trúc thư mục | |
| 4-5 | Schema + Migration | |
| 6 | Auth | Login local (username/password), JWT + refresh cookie. **Đã cân nhắc rồi BỎ OAuth Google/GitHub** (lý do: tên hiển thị không kiểm soát được, khó tra cứu) |
| 7 | User Module | Admin tạo Teacher/Student, password sinh ngẫu nhiên trả về 1 lần |
| 8 | Course Module | |
| 9 | Class Module | Many-to-many Class↔Teacher qua bảng `class_teachers`. Teacher tự tạo được Class (tự động gán chính mình). **Đã vá lỗ hổng IDOR** ở `GET /api/classes` (query `teacherId` không được phép override khi caller là TEACHER) |
| 10 | Enrollment Module | Enroll hàng loạt kiểu "best effort" (`{enrolled, skipped}`) |
| 11 | Playlist & Video Module | Playlist gắn với **Class** (không phải Course — đã đổi thiết kế). Video chỉ nhận link YouTube |
| 12 | Exam Module | Status DRAFT/PUBLISHED/CLOSED, Student chỉ thấy khi PUBLISHED |
| 13 | Question Module | CRUD thủ công xong. **Import từ Excel/Word/PDF đã viết lại hoàn toàn** — Word dùng parser đọc BẢNG (table) theo đúng template chuẩn MindX thật (không phải cú pháp text tự do ban đầu), hỗ trợ ảnh nhúng tự động upload Cloudinary qua `mammoth.convertToHtml` + `cheerio`. Có thêm field `contentImageUrl`, `difficultyLevel`, `skillTag` |
| 14 | Submission Module | Có `attemptNumber`, xáo trộn câu hỏi/đáp án khi làm lại (chỉ từ lần 2 trở đi), Teacher chấm 1 lần duy nhất |
| 15 | Assignment Module | Nộp file lên Cloudinary, cho nộp lại nhiều lần (ghi đè), `isLate` tự động, Teacher chấm lại được nhiều lần |
| 16 | Dashboard Module | `/api/dashboard/admin`, `/api/dashboard/teacher` |
| Upload chung | `POST /api/uploads/image` | Dùng cho CRUD Question thủ công gắn ảnh |
| 17a | ClassSession (lịch học) | Lịch lặp cố định (nhiều ngày/tuần), buổi lẻ/bù, **check trùng lịch giáo viên** (best effort khi tạo hàng loạt) |
| 17b | Tích hợp lịch vào Dashboard | Teacher Dashboard thêm `todaySchedule` (`{count, sessions}`) và `nextUpcomingDate` (`{date, sessionsCount}` hoặc `null`) — **chỉ query `nextUpcomingDate` khi hôm nay rỗng**, tránh 1 query thừa; KHÔNG đổi field cũ (`classes/students/exams/assignments`). Tạo mới `GET /api/dashboard/student` trả `currentSessions`/`nextSession`. Ranh giới "hôm nay" tính theo **giờ local của máy chạy server** (`Date.getFullYear/Month/Date`, không phải UTC) — đã verify thực tế: session lúc 18:47 UTC bị coi là "ngày mai" vì server chạy `Asia/Saigon` (UTC+7); cần nhớ lại điểm này nếu sau này deploy server ở timezone khác. Lọc session theo giáo viên/học sinh qua relation `class.teachers`/`class.enrollments` (chỉ tính `Enrollment.status = ACTIVE`) trong 1 round-trip duy nhất, không tách 2 bước lấy classId rồi mới query session. Test 5 case qua API thật (không đụng DB trực tiếp): có lịch hôm nay, lịch lệch ranh giới ngày, session đang diễn ra + sắp tới, không có lịch hôm nay nhưng có lịch tương lai, và học sinh không enroll lớp nào — cả 5 đều pass |

### Chưa làm (theo đúng thứ tự ưu tiên đã thống nhất)

1. Thông báo trong app (không dùng email) khi có Exam sắp diễn ra trong 7 ngày/1 ngày — tính real-time mỗi khi Student gọi API, KHÔNG lưu trữ thông báo riêng, KHÔNG cần cron
2. Email kết quả kiểm tra + câu cần chú ý ôn tập (dùng **Resend**, đang setup) — chưa thiết kế chi tiết
3. Bước 18: Testing tổng thể toàn hệ thống bằng Postman
4. Bước 20: Tối ưu bảo mật production

### Đã KHÔNG làm / quyết định bỏ qua

- OAuth Google/GitHub login — đã cân nhắc rồi bỏ
- Cron Jobs cho nhắc lịch — đã đổi hướng, chuyển sang tính real-time khi Student gọi API để tránh phụ thuộc cron (Render free tier sleep sau 15 phút idle nên cron không chạy được ổn định)
- OCR cho import câu hỏi — không cần vì giáo viên luôn soạn đề trực tiếp trên máy tính (không có nhu cầu số hóa đề giấy scan)

## 4. Deploy hiện tại

- **Backend**: Render, Free tier Web Service, region Singapore. Domain: (điền domain thật khi có)
- **Database**: Neon — branch `production` cho Render, branch `local` cho máy dev
- **File storage**: Cloudinary (đã cấu hình, đang hoạt động)
- **Frontend**: Vercel, domain production `https://educor-lms-fe.vercel.app`
- CORS: dynamic origin callback, cho phép `localhost:3000`, `FRONTEND_URL` (biến môi trường), và mọi `*.vercel.app` (preview deployments)
- Cookie `refreshToken`: `sameSite: 'none'` khi production (bắt buộc vì FE/BE khác domain), `'lax'` khi dev local

## 5. Các bug/vấn đề đã gặp và cách đã xử lý (tránh lặp lại)

| Vấn đề | Nguyên nhân | Đã xử lý |
|---|---|---|
| Prisma Client không tìm thấy file `.ts` | Prisma 7 sinh code TypeScript thuần | Downgrade về Prisma 6, dùng generator `prisma-client-js` cổ điển |
| `req.query` không gán được | Express 5 đổi `req.query` thành getter-only | Dùng `req.validatedQuery` riêng thay vì ghi đè `req.query` |
| `result.error.errors` undefined | Zod v4 đổi `.errors` thành `.issues` | Đã sửa toàn bộ middleware validate |
| 403 Forbidden, `Server: AirTunes` khi gọi `localhost:5000` | macOS AirPlay Receiver chiếm port 5000 | Tắt AirPlay Receiver trong System Settings, hoặc đổi PORT |
| Cloudinary 403 "missing create permission" khi upload PDF/ZIP | Cấu hình Restricted media types (đã xác minh 2 mục Console không phải nguyên nhân — cần xem lỗi JSON chi tiết mới ra nguyên nhân thật) | Đã fix, upload thành công |
| IDOR ở `GET /api/classes?teacherId=` | `query.teacherId \|\| requestUser.id` cho phép client override giới hạn bảo mật | Sửa thành nhánh điều kiện tách biệt theo role |

## 6. Quy ước code quan trọng cần tuân thủ khi thêm module mới

- Response format: LUÔN dùng `successResponse`/`errorResponse` từ `src/utils/apiResponse.js`
- Lỗi nghiệp vụ: `throw new AppError(statusCode, message)` (từ `src/modules/auth/auth.service.js`)
- Phân quyền: `authenticate` + `authorize([ROLES...])`, helper `isTeacherAssignedToClass`/`isStudentEnrolledInClass` (từ `src/modules/exam/exam.repository.js`) — LUÔN tái sử dụng, không viết lại logic check quyền
- Pattern "best effort" (dùng cho enroll hàng loạt, import file): trả về `{success items, skipped items kèm lý do}`, không fail toàn bộ vì 1 lỗi
- Field ẩn theo role: câu hỏi có `sanitizeXxxForStudent()` để ẩn dữ liệu nhạy cảm (VD `correctAnswer`) — luôn double-check không vô tình ẩn nhầm field khác (ảnh, v.v.)

## 7. Nguyên tắc làm việc với Claude (chat) và Claude Code (agent) trong dự án này

- Claude (chat) luôn xác nhận rõ thiết kế/rule nghiệp vụ bằng lời TRƯỚC khi đưa prompt code cho agent
- Agent chỉ code sau khi có prompt chi tiết từ Claude (chat), không tự ý thêm tính năng ngoài phạm vi prompt
- Sau mỗi bước hoàn thành và test xong, cập nhật lại file `CLAUDE.md` này (mục 3) để giữ tiến độ luôn cập nhật
