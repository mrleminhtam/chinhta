
export enum ErrorType {
  SPELLING = 'Chính tả',
  GRAMMAR = 'Ngữ pháp',
  STYLE = 'Phong cách',
  PUNCTUATION = 'Dấu câu'
}

export type AIModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export enum AIMode {
  STANDARD = 'Tiêu chuẩn',
  ACADEMIC = 'Hàn lâm',
  CREATIVE = 'Sáng tạo',
  PROFESSIONAL = 'Công việc'
}

export interface SpellingError {
  original: string;
  replacement: string;
  reason: string;
  type: ErrorType;
}

export interface AnalysisResult {
  originalText: string;
  correctedText: string;
  errors: SpellingError[];
  overallFeedback: string;
}

export interface TextStats {
  words: number;
  characters: number;
  sentences: number;
  errorCount: number;
}

export interface AIConfig {
  model: AIModelType;
  mode: AIMode;
}
