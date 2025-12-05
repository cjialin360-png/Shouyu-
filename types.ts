export interface SignDefinition {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  instruction: string;
}

export enum AppPhase {
  INTRO = 'INTRO',
  TEACHING_SELECTION = 'TEACHING_SELECTION',
  PRACTICE = 'PRACTICE',
  GENERATING_NARRATIVE = 'GENERATING_NARRATIVE',
  RESULT = 'RESULT',
}

export interface RecognitionResult {
  match: boolean;
  feedback: string;
}

export interface GeneratedContent {
  story: string;
  imageUrl: string;
}
