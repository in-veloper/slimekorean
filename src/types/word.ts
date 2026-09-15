export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTIES: { id: Difficulty; label: string; perDay: number }[] = [
  { id: 'easy', label: '쉬움', perDay: 8 },
  { id: 'normal', label: '보통', perDay: 12 },
  { id: 'hard', label: '어려움', perDay: 16 },
];

// 테스트 한 판의 문항 수 — 프로필 설정에서 고른다.
export const QUIZ_LENGTHS = [10, 20, 30] as const;
export const DEFAULT_QUIZ_LENGTH = 10;

export type WordGrade = '초급' | '중급' | '고급';

// krdict(한국어기초사전) 에서 실시간으로 받아온 낱말 한 건.
export interface KrWord {
  id: string; // target_code
  word: string;
  pos: string; // 품사(명사/동사/형용사...)
  grade: WordGrade;
  pronunciation: string;
  definition: string;
  examples: string[];
}

export type PhraseKind = 'proverb' | 'idiom';

export interface KrPhrase {
  id: string;
  word: string;
  kind: PhraseKind;
  definition: string;
}

export type QuizKind =
  | 'wordToMeaning' // 단어 → 뜻 맞히기
  | 'meaningToWord' // 뜻 → 단어 맞히기
  | 'initial' // 초성 퀴즈
  | 'sentenceBlank' // 문장에서 알맞은 단어 고르기
  | 'synonym' // 비슷한 말 찾기
  | 'antonym' // 반대말 찾기
  | 'phrase'; // 속담/관용구 퀴즈

export interface QuizQuestion {
  kind: QuizKind;
  word: KrWord; // 정답의 바탕이 되는 낱말(발음 듣기 등에 쓴다)
  prompt: string; // 화면에 보여줄 문제 텍스트
  answer: string; // 정답 보기 텍스트
  options: string[]; // 보기 4개(정답 포함, 섞여 있음)
}

// 스텝(하루 분량)을 통과했다는 기록만 남긴다.
export interface StepRecord {
  step: number;
  score: number; // 0~100
  earnedAt: number;
}

export interface ProfileProgress {
  currentStep: number; // 다음에 풀 스텝(0부터 시작)
  completedSteps: StepRecord[];
  learnedWordCount: number;
  stickers: string[];
  // 최근에 틀린 낱말(낱말 텍스트) 목록 — "틀린 단어 복습" 모드에서 다시
  // 낸다. 나중에 한 번이라도 다시 맞히면(문제로 나온 순간, 첫 시도에
  // 맞혔든 아니든) 목록에서 빠진다 — 계속 붙잡아 두기보다 "한 번 더
  // 볼 기회"만 준다는 쪽이 아이에게 덜 부담스럽다.
  wrongWords: string[];
}

export interface Profile {
  id: string;
  name: string;
  hat: string; // art.js HAT_IDS 중 하나
  color: string; // theme.js COLORS 아이디 중 하나
  difficulty: Difficulty;
  quizLength: number; // 테스트 한 판의 문항 수(QUIZ_LENGTHS 중 하나)
  progress: ProfileProgress;
}
