import xlsx from 'xlsx';

// A-F -> tối đa 6 lựa chọn, khớp với giới hạn KEY_LETTERS ở form "Thêm câu hỏi" thủ công (FE).
const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

const cellToTrimmedString = (value) => (value === undefined || value === null ? '' : String(value).trim());

export const parseExcelQuestions = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const parsed = [];
  const skipped = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 vì dòng 1 là header, Excel đếm từ 1
    const type = String(row.type || '').trim().toUpperCase();

    if (!['MULTIPLE_CHOICE', 'ESSAY', 'CODE'].includes(type)) {
      skipped.push({ row: rowNumber, reason: `type không hợp lệ: "${row.type}"` });
      return;
    }

    if (!row.content || String(row.content).trim().length < 3) {
      skipped.push({ row: rowNumber, reason: 'content trống hoặc quá ngắn' });
      return;
    }

    const question = {
      type,
      content: String(row.content).trim(),
      score: Number(row.score) > 0 ? Number(row.score) : 1,
    };

    const contentImageUrl = cellToTrimmedString(row.contentImageUrl);
    if (contentImageUrl) question.contentImageUrl = contentImageUrl;

    const difficultyLevel = cellToTrimmedString(row.difficultyLevel);
    if (difficultyLevel) question.difficultyLevel = difficultyLevel;

    const skillTag = cellToTrimmedString(row.skillTag);
    if (skillTag) question.skillTag = skillTag;

    if (type === 'MULTIPLE_CHOICE') {
      const options = [];
      OPTION_KEYS.forEach((key) => {
        const text = cellToTrimmedString(row[`option${key}`]);
        const imageUrl = cellToTrimmedString(row[`option${key}ImageUrl`]);
        if (text || imageUrl) {
          options.push({ key, text, ...(imageUrl && { imageUrl }) });
        }
      });

      if (options.length < 2) {
        skipped.push({ row: rowNumber, reason: 'MULTIPLE_CHOICE cần ít nhất 2 lựa chọn (optionA, optionB...)' });
        return;
      }

      const correctAnswer = String(row.correctAnswer || '').trim().toUpperCase();
      if (!options.some((o) => o.key === correctAnswer)) {
        skipped.push({ row: rowNumber, reason: `correctAnswer "${row.correctAnswer}" không khớp với option nào` });
        return;
      }

      question.options = options;
      question.correctAnswer = correctAnswer;
    }

    parsed.push(question);
  });

  return { parsed, skipped };
};