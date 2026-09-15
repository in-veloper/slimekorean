// @ts-ignore - art.js 는 순수 JS(그림 컴포넌트)라 타입 선언이 없다.
import { STICKERS } from '../art';

// 성적에 따라 등급 우선순위를 바꾸는 방식(잘 볼수록 높은 등급부터)을
// 써봤는데, 실력이 좋은 아이는 계속 만점을 받으니 전설만 계속 채워지고
// 실버·골드는 영원히 안 채워지는 문제가 있었다 — "언제 다 차냐"는 질문이
// 나온 이유가 그것. 지금은 등급을 무조건 순서대로 채운다: 실버 10장을
// 다 모아야 골드가 나오기 시작하고, 골드 8장을 다 모아야 전설이 나온다.
// 통과만 하면(70점 이상) 성적과 무관하게 한 장씩 받는다 — 대신 몇 번째
// 판인지가 등급을 정한다. 같은 등급 안에서 어떤 스티커가 나올지는
// 무작위라 "이번엔 뭐가 나올까" 하는 기대감은 그대로 남는다.
export function pickSticker(owned: string[]) {
  const has = new Set(owned);
  const left = STICKERS.filter((s: any) => !has.has(s.id));
  if (!left.length) return null;

  for (const tier of [1, 2, 3]) {
    const pool = left.filter((s: any) => s.tier === tier);
    if (pool.length) return pool[(Math.random() * pool.length) | 0];
  }
  return left[0];
}
