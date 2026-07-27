import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { parseExcelQuestions } from './excelParser.js';
import { parseTextQuestions } from './textParser.js';
import { AppError } from '../../auth/auth.service.js';

export const extractQuestionsFromFile = async (file) => {
  const { mimetype, buffer } = file;

  if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return parseExcelQuestions(buffer);
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return parseTextQuestions(result.value);
  }

  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return parseTextQuestions(result.text);
  }

  throw new AppError(400, 'Định dạng file không được hỗ trợ');
};