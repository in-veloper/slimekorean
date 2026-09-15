// 이름을 부를 때 붙이는 조사("야"/"아")를 받침 유무로 정확히 고른다.
export function callName(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '친구';

  const last = clean[clean.length - 1];
  const code = last.charCodeAt(0);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangulSyllable) return clean;

  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return `${clean}${hasBatchim ? '아' : '야'}`;
}

const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

// 완성형 한글 음절 하나에서 초성만 뽑아낸다. 유니코드 한글 음절 코드는
// (초성*21 + 중성)*28 + 종성 + 0xAC00 으로 계산되므로, 21*28=588 로 나눈
// 몫이 초성 인덱스다. 한글이 아닌 글자(띄어쓰기, 숫자 등)는 그대로 둔다.
export function getInitial(char: string): string {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return char;
  const initialIndex = Math.floor((code - 0xac00) / 588);
  return INITIALS[initialIndex] ?? char;
}

// 단어 전체를 초성으로 바꾼다 — 초성 퀴즈에 쓴다. "사과" → "ㅅㄱ".
export function getInitials(word: string): string {
  return [...word].map(getInitial).join('');
}
