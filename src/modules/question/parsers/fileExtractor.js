import { parseExcelQuestions } from './excelParser.js';
import { parseDocxTableQuestions } from './docxTableParser.js';
import { parsePdfQuestions } from './pdfTextParser.js';
import { AppError } from '../../auth/auth.service.js';

export const extractQuestionsFromFile = async (file) => {
  const { mimetype, buffer } = file;

  if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return parseExcelQuestions(buffer);
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocxTableQuestions(buffer);
  }

  if (mimetype === 'application/pdf') {
    return parsePdfQuestions(buffer);
  }

  throw new AppError(400, 'Định dạng file không được hỗ trợ');
};
