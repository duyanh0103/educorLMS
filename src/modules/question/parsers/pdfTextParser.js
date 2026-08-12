import { PDFParse } from 'pdf-parse';

// PDF không giữ cấu trúc bảng như docx -> chỉ lấy text thuần rồi regex theo đúng cú pháp
// mẫu MindX ("CÂU HỎI N (mức độ - kỹ năng): ... A. ... B. ... Đáp án đúng là: X").
// Đây là định dạng kém chính xác nhất trong 3 loại file, chấp nhận tỷ lệ skip cao hơn.
// Không hỗ trợ ảnh, không xử lý phần THỰC HÀNH (theo đúng yêu cầu).
const QUESTION_HEADER_REGEX = /CÂU\s*HỎI\s*(\d+)\s*(?:\(([^)]*)\))?\s*:/gi;
const OPTION_LINE_REGEX = /^([A-D])\.\s*(.+)$/;
const ANSWER_REGEX = /Đáp\s*án\s*đúng\s*là\s*:?\s*([A-D])/i;

const parseMeta = (metaGroup) => {
  if (!metaGroup) return { difficultyLevel: undefined, skillTag: undefined };
  const parts = metaGroup.split('-').map((s) => s.trim()).filter(Boolean);
  return { difficultyLevel: parts[0] || undefined, skillTag: parts[1] || undefined };
};

const parseQuestionBlock = (block, questionNumber) => {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

  const contentLines = [];
  const options = [];
  for (const line of lines) {
    const optMatch = line.match(OPTION_LINE_REGEX);
    if (optMatch) {
      options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
    } else if (options.length === 0 && !ANSWER_REGEX.test(line)) {
      contentLines.push(line);
    }
  }

  const content = contentLines.join(' ').trim();
  const answerMatch = block.match(ANSWER_REGEX);
  const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : null;

  if (!content) {
    return { error: { row: questionNumber, reason: 'Câu hỏi rỗng' } };
  }

  const validOptions = options.filter((o) => o.text);
  if (validOptions.length < 2) {
    return { error: { row: questionNumber, reason: 'Không đủ lựa chọn hợp lệ' } };
  }

  if (!correctAnswer || !validOptions.some((o) => o.key === correctAnswer)) {
    return { error: { row: questionNumber, reason: 'Thiếu hoặc sai Đáp án đúng là' } };
  }

  return { question: { content, options: validOptions, correctAnswer } };
};

export const parsePdfQuestions = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  const rawText = result.text;

  const parsed = [];
  const skipped = [];

  const matches = [...rawText.matchAll(QUESTION_HEADER_REGEX)];

  if (matches.length === 0) {
    skipped.push({ row: null, reason: 'Không tìm thấy câu hỏi nào theo đúng cú pháp "CÂU HỎI N (...): "' });
    return { parsed, skipped };
  }

  matches.forEach((match, index) => {
    const questionNumber = Number(match[1]) || index + 1;
    const { difficultyLevel, skillTag } = parseMeta(match[2]);

    const startIndex = match.index + match[0].length;
    const endIndex = matches[index + 1] ? matches[index + 1].index : rawText.length;
    const block = rawText.slice(startIndex, endIndex).trim();

    const { question, error } = parseQuestionBlock(block, questionNumber);
    if (error) {
      skipped.push(error);
      return;
    }

    parsed.push({
      type: 'MULTIPLE_CHOICE',
      content: question.content,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficultyLevel,
      skillTag,
      score: 1,
    });
  });

  return { parsed, skipped };
};
