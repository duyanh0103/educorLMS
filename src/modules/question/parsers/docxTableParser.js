import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { uploadImageToCloudinary } from '../../../utils/uploadImage.js';

// Template thật MindX: bảng metadata đầu file (bỏ qua) -> heading "TRẮC NGHIỆM" -> N bảng,
// mỗi bảng = 1 câu hỏi -> heading "THỰC HÀNH" (optional) -> 1 bảng ĐỀ BÀI/HƯỚNG DẪN = 1 câu CODE.
// mammoth.convertToHtml (KHÔNG dùng extractRawText) để giữ <table> và ảnh nhúng thành base64 <img>.

const HEADER_META_REGEX = /CÂU\s*HỎI\s*\d+\s*(?:\(([^)]*)\))?\s*:/i;
const ANSWER_REGEX = /Đáp\s*án\s*đúng\s*là\s*:?\s*([A-D])/i;
const OPTION_LABEL_REGEX = /^([A-D])\.?$/i;
const DE_BAI_REGEX = /^ĐỀ\s*BÀI\s*:?$/i;
const HUONG_DAN_REGEX = /^HƯỚNG\s*DẪN\s*:?$/i;

const normalizeHeadingText = (text) => text.replace(/\s+/g, ' ').trim().toUpperCase();

const parseMeta = (metaGroup) => {
  if (!metaGroup) return { difficultyLevel: undefined, skillTag: undefined };
  const parts = metaGroup.split('-').map((s) => s.trim()).filter(Boolean);
  return { difficultyLevel: parts[0] || undefined, skillTag: parts[1] || undefined };
};

// Trả về text (đã bỏ <img>) + danh sách src của mọi <img> tìm thấy trong cell (thường 0 hoặc 1).
const extractCellContent = ($, cell) => {
  const $cell = $(cell);
  const imgSrcs = $cell.find('img').map((_, img) => $(img).attr('src')).get().filter(Boolean);
  const text = $cell.clone().find('img').remove().end().text().replace(/\s+/g, ' ').trim();
  return { text, imgSrcs };
};

const parseMultipleChoiceTable = ($, table, questionNumber) => {
  const rows = $(table).find('tr').toArray();
  if (rows.length < 2) {
    return { error: { row: questionNumber, reason: 'Cấu trúc bảng không hợp lệ (thiếu dòng câu hỏi/lựa chọn)' } };
  }

  const headerCells = $(rows[0]).find('td, th');
  if (headerCells.length < 2) {
    return { error: { row: questionNumber, reason: 'Cấu trúc bảng không hợp lệ (thiếu header)' } };
  }

  const headerLabel = headerCells.eq(0).text().replace(/\s+/g, ' ').trim();
  const metaMatch = headerLabel.match(HEADER_META_REGEX);
  const { difficultyLevel, skillTag } = parseMeta(metaMatch ? metaMatch[1] : undefined);

  const { text: content, imgSrcs: contentImgSrcs } = extractCellContent($, headerCells.eq(1));

  const rawOptions = [];
  let correctAnswer = null;

  for (const row of rows.slice(1)) {
    const rowText = $(row).text().replace(/\s+/g, ' ').trim();
    const answerMatch = rowText.match(ANSWER_REGEX);
    if (answerMatch) {
      correctAnswer = answerMatch[1].toUpperCase();
      continue;
    }

    const cells = $(row).find('td, th');
    if (cells.length < 2) continue;

    const label = cells.eq(0).text().trim();
    const labelMatch = label.match(OPTION_LABEL_REGEX);
    if (!labelMatch) continue;

    const { text, imgSrcs } = extractCellContent($, cells.eq(1));
    rawOptions.push({ key: labelMatch[1].toUpperCase(), text, imgSrcs });
  }

  if (!content && contentImgSrcs.length === 0) {
    return { error: { row: questionNumber, reason: 'Câu hỏi rỗng' } };
  }

  const validOptions = rawOptions.filter((o) => o.text || o.imgSrcs.length > 0);
  if (validOptions.length < 2) {
    return { error: { row: questionNumber, reason: 'Không đủ lựa chọn hợp lệ' } };
  }

  if (!correctAnswer || !validOptions.some((o) => o.key === correctAnswer)) {
    return { error: { row: questionNumber, reason: 'Thiếu hoặc sai Đáp án đúng là' } };
  }

  return {
    pending: {
      type: 'MULTIPLE_CHOICE',
      content,
      contentImgSrc: contentImgSrcs[0],
      options: validOptions.map((o) => ({ key: o.key, text: o.text, imgSrc: o.imgSrcs[0] })),
      correctAnswer,
      difficultyLevel,
      skillTag,
      score: 1,
    },
  };
};

const parsePracticalTable = ($, table) => {
  const rows = $(table).find('tr').toArray();

  let deBai = null;
  let huongDan = null;

  for (const row of rows) {
    const cells = $(row).find('td, th');
    if (cells.length < 2) continue;

    const label = cells.eq(0).text().replace(/\s+/g, ' ').trim();
    if (DE_BAI_REGEX.test(label)) {
      deBai = extractCellContent($, cells.eq(1));
    } else if (HUONG_DAN_REGEX.test(label)) {
      huongDan = extractCellContent($, cells.eq(1));
    }
  }

  if (!deBai && !huongDan) {
    return { error: { row: null, reason: 'Không tìm thấy dòng ĐỀ BÀI/HƯỚNG DẪN trong bảng Thực hành' } };
  }

  const contentParts = [];
  if (deBai?.text) contentParts.push(`ĐỀ BÀI: ${deBai.text}`);
  if (huongDan?.text) contentParts.push(`HƯỚNG DẪN:\n${huongDan.text}`);

  const content = contentParts.join('\n\n').trim();
  if (!content) {
    return { error: { row: null, reason: 'Câu hỏi Thực hành rỗng' } };
  }

  // Model chỉ có 1 slot contentImageUrl -> lấy ảnh đầu tiên tìm thấy (ĐỀ BÀI ưu tiên trước).
  const allImgSrcs = [...(deBai?.imgSrcs || []), ...(huongDan?.imgSrcs || [])];

  return {
    pending: {
      type: 'CODE',
      content,
      contentImgSrc: allImgSrcs[0],
      score: 1,
    },
  };
};

export const parseDocxTableQuestions = async (buffer) => {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(html);

  const topLevel = $('body').children().toArray();

  const mcStartIdx = topLevel.findIndex((el) => normalizeHeadingText($(el).text()) === 'TRẮC NGHIỆM');
  const practicalStartIdx = topLevel.findIndex(
    (el, idx) => idx > mcStartIdx && normalizeHeadingText($(el).text()) === 'THỰC HÀNH'
  );

  const parsed = [];
  const skipped = [];
  const pendingList = [];

  if (mcStartIdx === -1) {
    skipped.push({ row: null, reason: 'Không tìm thấy heading "TRẮC NGHIỆM" trong file' });
  } else {
    const mcEndIdx = practicalStartIdx === -1 ? topLevel.length : practicalStartIdx;
    const mcTables = topLevel.slice(mcStartIdx + 1, mcEndIdx).filter((el) => el.tagName === 'table');

    mcTables.forEach((table, idx) => {
      const questionNumber = idx + 1;
      const { pending, error } = parseMultipleChoiceTable($, table, questionNumber);
      if (error) {
        skipped.push(error);
      } else {
        pendingList.push(pending);
      }
    });
  }

  if (practicalStartIdx !== -1) {
    const practicalTable = topLevel.slice(practicalStartIdx + 1).find((el) => el.tagName === 'table');
    if (practicalTable) {
      const { pending, error } = parsePracticalTable($, practicalTable);
      if (error) {
        skipped.push(error);
      } else {
        pendingList.push(pending);
      }
    }
  }

  // Upload toàn bộ ảnh song song (Promise.all) rồi mới build kết quả cuối.
  const uploadTasks = [];
  for (const q of pendingList) {
    if (q.contentImgSrc) {
      uploadTasks.push(
        uploadImageToCloudinary(q.contentImgSrc).then((url) => { q.contentImageUrl = url; })
      );
    }
    for (const opt of q.options || []) {
      if (opt.imgSrc) {
        uploadTasks.push(
          uploadImageToCloudinary(opt.imgSrc).then((url) => { opt.imageUrl = url; })
        );
      }
    }
  }
  await Promise.all(uploadTasks);

  for (const q of pendingList) {
    const question = {
      type: q.type,
      content: q.content,
      contentImageUrl: q.contentImageUrl,
      score: q.score,
    };
    if (q.type === 'MULTIPLE_CHOICE') {
      question.options = q.options.map((o) => ({ key: o.key, text: o.text, imageUrl: o.imageUrl }));
      question.correctAnswer = q.correctAnswer;
      question.difficultyLevel = q.difficultyLevel;
      question.skillTag = q.skillTag;
    }
    parsed.push(question);
  }

  return { parsed, skipped };
};
