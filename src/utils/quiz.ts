import { getPhrases, getWords } from '../api/krdict';
import { SEED_PHRASES } from '../data/seedPhrases';
import { ANTONYM_PAIRS, SYNONYM_PAIRS, WordPair } from '../data/relations';
import { DEFAULT_QUIZ_LENGTH, KrWord, QuizKind, QuizQuestion } from '../types/word';
import { getInitials } from './korean';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors<T>(pool: T[], exclude: T[], count: number): T[] {
  const excluded = new Set(exclude);
  return shuffle(pool.filter((p) => !excluded.has(p))).slice(0, count);
}

function wordToMeaningQ(word: KrWord, pool: KrWord[]): QuizQuestion | null {
  const distractors = pickDistractors(
    pool.map((w) => w.definition),
    [word.definition],
    3
  );
  if (distractors.length < 3) return null;
  return {
    kind: 'wordToMeaning',
    word,
    prompt: word.word,
    answer: word.definition,
    options: shuffle([word.definition, ...distractors]),
  };
}

function meaningToWordQ(word: KrWord, pool: KrWord[]): QuizQuestion | null {
  const distractors = pickDistractors(
    pool.map((w) => w.word),
    [word.word],
    3
  );
  if (distractors.length < 3) return null;
  return {
    kind: 'meaningToWord',
    word,
    prompt: word.definition,
    answer: word.word,
    options: shuffle([word.word, ...distractors]),
  };
}

function initialQ(word: KrWord, pool: KrWord[]): QuizQuestion | null {
  const distractors = pickDistractors(
    pool.map((w) => w.word),
    [word.word],
    3
  );
  if (distractors.length < 3) return null;
  return {
    kind: 'initial',
    word,
    prompt: `${word.definition}\n(초성 힌트: ${getInitials(word.word)})`,
    answer: word.word,
    options: shuffle([word.word, ...distractors]),
  };
}

// 예문에 그 낱말의 사전형(기본형) 그대로가 들어 있는 경우만 빈칸으로 만든다 —
// 동사·형용사는 예문에서 "커", "크니" 처럼 활용된 모양으로 나와서 원래
// 글자를 그대로 찾아 빈칸 처리할 수 없는 경우가 많다.
function sentenceBlankQ(word: KrWord, pool: KrWord[]): QuizQuestion | null {
  const example = word.examples.find((e) => e.includes(word.word));
  if (!example) return null;

  const blanked = example.replace(word.word, '＿'.repeat(Math.min(4, Math.max(2, word.word.length))));
  const distractors = pickDistractors(
    pool.map((w) => w.word),
    [word.word],
    3
  );
  if (distractors.length < 3) return null;
  return {
    kind: 'sentenceBlank',
    word,
    prompt: blanked,
    answer: word.word,
    options: shuffle([word.word, ...distractors]),
  };
}

function sample<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

// pairs 전체를 다 조회하면 API 호출이 너무 많아져서(느려서) 몇 개만
// 무작위로 뽑아 그만큼만 불러온다. distractor 는 이미 받아 둔 words pool을
// 그대로 써서 추가 네트워크 호출이 없게 한다.
async function relationQuestions(
  pairs: WordPair[],
  kind: 'synonym' | 'antonym',
  pool: KrWord[],
  sampleCount: number
): Promise<QuizQuestion[]> {
  const picked = sample(pairs, sampleCount);
  const targets = picked.flatMap((p) => [p.a, p.b]);
  const fetched = await getWords(targets);
  const byWord = new Map(fetched.map((w) => [w.word, w]));

  const out: QuizQuestion[] = [];
  for (const pair of picked) {
    const wa = byWord.get(pair.a);
    const wb = byWord.get(pair.b);
    if (!wa || !wb) continue;
    const distractors = pickDistractors(
      pool.map((w) => w.word),
      [wa.word, wb.word],
      3
    );
    if (distractors.length < 3) continue;
    const label = kind === 'synonym' ? '비슷한 뜻을 가진 낱말' : '반대되는 뜻을 가진 낱말';
    out.push({
      kind,
      word: wa,
      prompt: `"${wa.word}"와(과) ${label}은?`,
      answer: wb.word,
      options: shuffle([wb.word, ...distractors]),
    });
  }
  return out;
}

async function phraseQuestions(sampleCount: number): Promise<QuizQuestion[]> {
  const picked = sample(SEED_PHRASES, sampleCount);
  const phrases = await getPhrases(picked);

  const out: QuizQuestion[] = [];
  for (const phrase of phrases) {
    const distractors = pickDistractors(
      phrases.map((p) => p.word),
      [phrase.word],
      3
    );
    if (distractors.length < 3) continue;
    out.push({
      kind: 'phrase',
      word: { id: phrase.id, word: phrase.word, pos: '', grade: '초급', pronunciation: phrase.word, definition: phrase.definition, examples: [] },
      prompt: `${phrase.definition}\n(${phrase.kind === 'proverb' ? '속담' : '관용구'})`,
      answer: phrase.word,
      options: shuffle([phrase.word, ...distractors]),
    });
  }
  return out;
}

// 오늘 배운 낱말로 여러 종류(단어→뜻/뜻→단어/초성/문장 빈칸)의 문제를 만든다.
// words 는 이미 다 받아 온 상태라 여기서는 추가 네트워크 호출이 없다.
export async function buildWordQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const pool = words;
  const builders: ((w: KrWord, p: KrWord[]) => QuizQuestion | null)[] = [
    wordToMeaningQ,
    meaningToWordQ,
    initialQ,
    sentenceBlankQ,
  ];

  const questions: QuizQuestion[] = [];
  for (const word of shuffle(words)) {
    const kind = builders[Math.floor(Math.random() * builders.length)];
    const q = kind(word, pool) ?? wordToMeaningQ(word, pool);
    if (q) questions.push(q);
  }

  return shuffle(questions).slice(0, limit);
}

// 아래는 메뉴에서 특정 문제 종류 하나만 골라 풀 때 쓰는 "단일 종류" 빌더들.
// buildWordQuiz 는 종류를 무작위로 섞지만, 이건 정확히 그 종류로만 문제를
// 만든다(문장 빈칸처럼 만들 수 없는 낱말은 걸러진다).

export async function buildWordToMeaningQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = shuffle(words)
    .map((w) => wordToMeaningQ(w, words))
    .filter((q): q is QuizQuestion => !!q);
  return qs.slice(0, limit);
}

export async function buildMeaningToWordQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = shuffle(words)
    .map((w) => meaningToWordQ(w, words))
    .filter((q): q is QuizQuestion => !!q);
  return qs.slice(0, limit);
}

export async function buildInitialQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = shuffle(words)
    .map((w) => initialQ(w, words))
    .filter((q): q is QuizQuestion => !!q);
  return qs.slice(0, limit);
}

// 예문에 사전형이 그대로 있는 낱말만 살아남기 때문에, 넉넉한 pool 을
// 받아서 그중 되는 것만 골라 쓴다 — 호출하는 쪽에서 words 를 limit 보다
// 넉넉히(예: 3배) 넘겨주는 게 좋다.
export async function buildSentenceBlankQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = shuffle(words)
    .map((w) => sentenceBlankQ(w, words))
    .filter((q): q is QuizQuestion => !!q);
  return qs.slice(0, limit);
}

// 전용 메뉴("비슷한말 찾기" 등)에서는 가진 짝/속담을 전부 시도한다 — 개수
// 자체가 많지 않은 데다(6~35개), 통신 상태가 안 좋아 몇 개가 실패해도
// 나머지로 문제를 만들 수 있게 여유를 준다. 부족한 채로 4개 미만만 성공하면
// (오답 보기를 못 채워서) 결과가 아예 없을 수 있는데, 그건 전용 빌더
// 호출자(App.tsx)가 "인터넷을 확인해 주세요" 로 안내한다.
export async function buildSynonymQuiz(pool: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = await relationQuestions(SYNONYM_PAIRS, 'synonym', pool, SYNONYM_PAIRS.length);
  return shuffle(qs).slice(0, limit);
}

export async function buildAntonymQuiz(pool: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = await relationQuestions(ANTONYM_PAIRS, 'antonym', pool, ANTONYM_PAIRS.length);
  return shuffle(qs).slice(0, limit);
}

export async function buildPhraseQuiz(limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const qs = await phraseQuestions(SEED_PHRASES.length);
  return shuffle(qs).slice(0, limit);
}

// "실력 뽐내기" 퀵 테스트용 — 낱말 문제에 비슷한말/반대말/속담·관용구까지
// 섞어서 더 다양하게 낸다. 전체 낱말 곳간을 다 불러오면 너무 오래
// 걸려서, 비슷한말/반대말/속담·관용구는 몇 개만 무작위로 뽑아 그만큼만
// 실시간으로 불러온다 — 그래야 로딩이 몇 초 안에 끝난다.
export async function buildMixedQuiz(words: KrWord[], limit: number = DEFAULT_QUIZ_LENGTH): Promise<QuizQuestion[]> {
  const wordQs = await buildWordQuiz(words, words.length);
  const [synonymQs, antonymQs, phraseQs] = await Promise.all([
    relationQuestions(SYNONYM_PAIRS, 'synonym', words, 3),
    relationQuestions(ANTONYM_PAIRS, 'antonym', words, 5),
    phraseQuestions(5),
  ]);

  const all = shuffle([...wordQs, ...synonymQs, ...antonymQs, ...phraseQs]);
  return all.slice(0, limit);
}

export type { QuizKind };
