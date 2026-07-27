// Cú pháp mẫu:
// Câu 1: [MULTIPLE_CHOICE] [1 điểm]
// Nội dung câu hỏi...
// A. Lựa chọn 1
// B. Lựa chọn 2
// Đáp án đúng: A
//
// Câu 2: [ESSAY] [2 điểm]
// Nội dung câu hỏi tự luận...

const QUESTION_BLOCK_REGEX = /Câu\s*\d+\s*:\s*\[(MULTIPLE_CHOICE|ESSAY|CODE)\]\s*\[\s*([\d.]+)\s*điểm\]/gi;

export const parseTextQuestions = (rawText) => {
  const parsed = [];
  const errors = [];

  // Tách văn bản thành từng block theo vị trí "Câu N:"
  const matches = [...rawText.matchAll(QUESTION_BLOCK_REGEX)];

  if (matches.length === 0) {
    errors.push({ row: null, reason: 'Không tìm thấy câu hỏi nào theo đúng cú pháp "Câu N: [TYPE] [X điểm]"' });
    return { parsed, errors };
  }

  matches.forEach((match, index) => {
    const questionNumber = index + 1;
    const type = match[1].toUpperCase();
    const score = parseFloat(match[2]) || 1;

    const startIndex = match.index + match[0].length;
    const endIndex = matches[index + 1] ? matches[index + 1].index : rawText.length;
    const block = rawText.slice(startIndex, endIndex).trim();

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

    if (type === 'MULTIPLE_CHOICE') {
      const optionLineRegex = /^([A-D])\.\s*(.+)$/;
      const answerLineRegex = /^Đáp\s*án\s*đúng\s*:\s*([A-D])$/i;

      const contentLines = [];
      const options = [];
      let correctAnswer = null;

      for (const line of lines) {
        const optMatch = line.match(optionLineRegex);
        const ansMatch = line.match(answerLineRegex);

        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase();
        } else if (optMatch) {
          options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
        } else if (options.length === 0) {
          contentLines.push(line);
        }
      }

      const content = contentLines.join(' ').trim();

      if (!content) {
        errors.push({ row: questionNumber, reason: 'Thiếu nội dung câu hỏi' });
        return;
      }
      if (options.length < 2) {
        errors.push({ row: questionNumber, reason: 'Cần ít nhất 2 lựa chọn (dòng dạng "A. ...")' });
        return;
      }
      if (!correctAnswer || !options.some((o) => o.key === correctAnswer)) {
        errors.push({ row: questionNumber, reason: 'Thiếu hoặc sai dòng "Đáp án đúng: X"' });
        return;
      }

      parsed.push({ type, content, options, correctAnswer, score });
    } else {
      // ESSAY / CODE — toàn bộ block là nội dung câu hỏi
      const content = lines.join(' ').trim();
      if (!content) {
        errors.push({ row: questionNumber, reason: 'Thiếu nội dung câu hỏi' });
        return;
      }
      parsed.push({ type, content, score });
    }
  });

  return { parsed, errors };
};