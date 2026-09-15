import { getWords } from '../api/krdict';
import { SEED_WORDS } from '../data/seedWords';
import { DIFFICULTIES, Difficulty, KrWord } from '../types/word';

export const MAP_LENGTH = 40;

function perDayOf(difficulty: Difficulty): number {
  return DIFFICULTIES.find((d) => d.id === difficulty)?.perDay ?? 10;
}

// 맵의 각 칸(스텝)에 해당하는 낱말들을 뽑아 krdict 에서 실시간으로 받아온다.
// 낱말 목록보다 스텝이 많아지면(끝까지 다 돌면) 처음부터 다시 순환한다.
export async function getStepWords(step: number, difficulty: Difficulty): Promise<KrWord[]> {
  const perDay = perDayOf(difficulty);
  const start = step * perDay;
  const picks: string[] = [];
  for (let i = 0; i < perDay; i += 1) {
    picks.push(SEED_WORDS[(start + i) % SEED_WORDS.length]);
  }
  return getWords(picks);
}

// "실력 뽐내기"(퀵 테스트)용 — 지금 스텝에 묶이지 않고 전체 낱말 곳간에서
// 매번 무작위로 한 판을 뽑는다.
export async function getRandomWords(count: number): Promise<KrWord[]> {
  const shuffled = [...SEED_WORDS].sort(() => Math.random() - 0.5);
  return getWords(shuffled.slice(0, Math.min(count, shuffled.length)));
}
