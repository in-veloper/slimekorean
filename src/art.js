import React from 'react';
import Svg, { Path, Ellipse, Circle, Rect, G } from 'react-native-svg';
import { colorOf } from './theme';

/* 만화에 나오는 그 슬라임 — 위는 봉긋하게 뾰족하고 아래는 넓게 퍼져
   바닥에 살짝 눌린 물방울. 머리 장식만 갈아끼워 종류를 만든다. */
const BODY =
  'M50 20 C57 41 86 53 86 70 C86 80 75 87 62 87 C58 87 57 84.5 53 84.5 ' +
  'C49 84.5 48 87 44 87 C31 87 14 80 14 70 C14 53 43 41 50 20 Z';
const GLOSS = 'M27 64 C30 54 40 45 48 42 C39 49 31 58 28 68 Z';
const CROWN_D = 'M13 70 L19 25 L35 45 L50 16 L65 45 L81 25 L87 70 Z';

const INK = '#4A2B45';

function Eyes({ mood }) {
  if (mood === 'oops') {
    return (
      <G>
        <Path d="M35 63 Q40 57 45 63" stroke={INK} strokeWidth={3.4} fill="none" strokeLinecap="round" />
        <Path d="M55 63 Q60 57 65 63" stroke={INK} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={39} cy={63} rx={5} ry={6.3} fill={INK} />
      <Ellipse cx={61} cy={63} rx={5} ry={6.3} fill={INK} />
      <Circle cx={41} cy={60.6} r={1.8} fill="#fff" />
      <Circle cx={63} cy={60.6} r={1.8} fill="#fff" />
    </G>
  );
}

function Mouth({ mood }) {
  if (mood === 'happy') {
    return (
      <G>
        <Path d="M37 72 Q50 88 63 72 Z" fill={INK} />
        <Path d="M44 79 Q50 84 56 79" fill="#FF8FA8" />
      </G>
    );
  }
  if (mood === 'oops') return <Ellipse cx={50} cy={77} rx={5.5} ry={7} fill={INK} />;
  return <Path d="M42 75 Q50 81 58 75" stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
}

/* 머리 장식 */
export const HATS = {
  plain: { n: '기본', Draw: () => null },
  horn: {
    n: '뿔',
    Draw: ({ c }) => <Path d="M50 21 C52 11 58 5 63 4 C61 11 58 17 53 23 Z" fill={c.cheek} />,
  },
  king: {
    n: '왕관',
    Draw: () => (
      <G>
        <Path d="M33 20 L36 5 L43 13 L50 2 L57 13 L64 5 L67 20 Z" fill="#FFC64B"
              stroke="#E8A317" strokeWidth={2.4} strokeLinejoin="round" />
        <Circle cx={50} cy={12} r={2.6} fill="#FF6B8A" />
      </G>
    ),
  },
  bunny: {
    n: '토끼',
    Draw: ({ c }) => (
      <G>
        <Ellipse cx={35} cy={16} rx={6} ry={15} fill={c.main} transform="rotate(-13 35 16)" />
        <Ellipse cx={65} cy={16} rx={6} ry={15} fill={c.main} transform="rotate(13 65 16)" />
        <Ellipse cx={35} cy={18} rx={2.7} ry={9.4} fill={c.cheek} opacity={0.6} transform="rotate(-13 35 18)" />
        <Ellipse cx={65} cy={18} rx={2.7} ry={9.4} fill={c.cheek} opacity={0.6} transform="rotate(13 65 18)" />
      </G>
    ),
  },
  star: {
    n: '별',
    Draw: () => (
      <G>
        <Path d="M50 22 L50 14" stroke="#FFC64B" strokeWidth={3.2} strokeLinecap="round" />
        <Path d="M50 1 L54 9 L63 10 L56 16 L58 25 L50 20 L42 25 L44 16 L37 10 L46 9 Z"
              fill="#FFC64B" stroke="#E8A317" strokeWidth={1.8} strokeLinejoin="round" />
      </G>
    ),
  },
  drop: {
    n: '물방울',
    Draw: ({ c }) => (
      <G>
        <Path d="M50 20 C52 12 57 8 57 4 C57 8 62 12 62 17 C62 21 59 24 56 24 C52 24 50 22 50 20 Z"
              fill={c.main} opacity={0.9} />
        <Circle cx={55} cy={12} r={2} fill="#fff" opacity={0.7} />
      </G>
    ),
  },
};
export const HAT_IDS = Object.keys(HATS);

export function Slime({ hat = 'plain', color = 'peach', mood = 'calm', size = 96 }) {
  const c = colorOf(color);
  const Hat = (HATS[hat] || HATS.plain).Draw;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Hat c={c} />
      <Path d={BODY} fill={c.main} />
      <Path d={GLOSS} fill="#fff" opacity={0.55} />
      <Ellipse cx={50} cy={84} rx={30} ry={4} fill={c.deep} opacity={0.35} />
      <Ellipse cx={27} cy={73} rx={6.6} ry={4.3} fill={c.cheek} opacity={0.75} />
      <Ellipse cx={73} cy={73} rx={6.6} ry={4.3} fill={c.cheek} opacity={0.75} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
    </Svg>
  );
}

/* 세기용 작은 슬라임 */
export function MiniSlime({ fill, size = 30, faded = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={faded ? 0.28 : 1}>
      <Path d={BODY} fill={faded ? '#B9AEB6' : fill} />
      <Path d={GLOSS} fill="#fff" opacity={0.5} />
      <Ellipse cx={41} cy={65} rx={3.8} ry={4.8} fill={INK} />
      <Ellipse cx={59} cy={65} rx={3.8} ry={4.8} fill={INK} />
      <Path d="M44 76 Q50 81 56 76" stroke={INK} strokeWidth={2.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* 왕관 — 정답을 맞히면 모이는 보상 */
export function Crown({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={CROWN_D} fill="#FFC64B" stroke="#E8A317" strokeWidth={4} strokeLinejoin="round" />
      <Path d="M21 68 L25 38 L34 49 Z" fill="#fff" opacity={0.3} />
      <Rect x={13} y={68} width={74} height={15} rx={7} fill="#F0A828" />
      <Rect x={13} y={68} width={74} height={6} rx={3} fill="#FFDA86" opacity={0.7} />
      <Circle cx={50} cy={43} r={6} fill="#FF6B8A" />
      <Circle cx={29} cy={57} r={4.2} fill="#4EC0E4" />
      <Circle cx={71} cy={57} r={4.2} fill="#7BD389" />
      <Circle cx={19} cy={22} r={4.6} fill="#FFF0A8" />
      <Circle cx={50} cy={13} r={5} fill="#FFF0A8" />
      <Circle cx={81} cy={22} r={4.6} fill="#FFF0A8" />
    </Svg>
  );
}

/* ---------- 스티커 ---------- */
const GoldSlime = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d={BODY} fill="#FFC64B" />
    <Path d="M14 70 C14 80 31 87 50 87 C69 87 86 80 86 70 C86 76 70 81 50 81 C30 81 14 76 14 70 Z" fill="#E8A317" opacity={0.55} />
    <Path d={GLOSS} fill="#fff" opacity={0.55} />
    <Ellipse cx={39} cy={64} rx={4.6} ry={5.8} fill="#6B3F10" />
    <Ellipse cx={61} cy={64} rx={4.6} ry={5.8} fill="#6B3F10" />
    <Circle cx={40.8} cy={61.8} r={1.7} fill="#fff" />
    <Circle cx={62.8} cy={61.8} r={1.7} fill="#fff" />
    <Path d="M40 74 Q50 87 60 74 Z" fill="#6B3F10" />
    <Path d="M76 26 L78 33 L85 35 L78 37 L76 44 L74 37 L67 35 L74 33 Z" fill="#FFF0A8" />
  </Svg>
);
const RedSlime = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d={BODY} fill="#F0504F" />
    <Path d="M14 70 C14 80 31 87 50 87 C69 87 86 80 86 70 C86 76 70 81 50 81 C30 81 14 76 14 70 Z" fill="#C63534" opacity={0.5} />
    <Path d={GLOSS} fill="#fff" opacity={0.5} />
    <Ellipse cx={39} cy={63} rx={4.6} ry={5.8} fill="#4A1010" />
    <Ellipse cx={61} cy={63} rx={4.6} ry={5.8} fill="#4A1010" />
    <Circle cx={40.8} cy={60.8} r={1.7} fill="#fff" />
    <Circle cx={62.8} cy={60.8} r={1.7} fill="#fff" />
    <Path d="M40 73 Q50 86 60 73 Z" fill="#4A1010" />
  </Svg>
);

const Heart = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 86 C10 60 14 28 34 24 C44 22 50 30 50 34 C50 30 56 22 66 24 C86 28 90 60 50 86 Z" fill="#FF6B8A" />
    <Ellipse cx={36} cy={40} rx={8} ry={5} fill="#fff" opacity={0.5} transform="rotate(-30 36 40)" />
  </Svg>
);
const Cloud = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={36} cy={58} rx={22} ry={18} fill="#4EC0E4" />
    <Ellipse cx={62} cy={60} rx={20} ry={16} fill="#4EC0E4" />
    <Ellipse cx={50} cy={46} rx={20} ry={17} fill="#6FD0EE" />
    <Circle cx={40} cy={50} r={4} fill="#fff" opacity={0.6} />
  </Svg>
);
const Candy = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={52} r={26} fill="#7C5CFF" />
    <Path d="M50 26 A26 26 0 0 1 76 52 Z" fill="#fff" opacity={0.45} />
    <Path d="M24 52 L6 38 L10 66 Z" fill="#FF6B8A" />
    <Path d="M76 52 L94 38 L90 66 Z" fill="#FF6B8A" />
  </Svg>
);
const Sprout = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 88 L50 44" stroke="#6FA86B" strokeWidth={7} strokeLinecap="round" />
    <Path d="M50 56 C34 56 24 44 24 32 C40 32 50 42 50 56 Z" fill="#7BD389" />
    <Path d="M50 48 C66 48 76 36 76 24 C60 24 50 34 50 48 Z" fill="#9FE0A8" />
    <Ellipse cx={50} cy={90} rx={18} ry={5} fill="#D9AE85" />
  </Svg>
);
const Rainbow = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M14 76 A36 36 0 0 1 86 76" fill="none" stroke="#FF6B8A" strokeWidth={9} strokeLinecap="round" />
    <Path d="M25 76 A25 25 0 0 1 75 76" fill="none" stroke="#FFA24B" strokeWidth={9} strokeLinecap="round" />
    <Path d="M36 76 A14 14 0 0 1 64 76" fill="none" stroke="#7BD389" strokeWidth={9} strokeLinecap="round" />
    <Ellipse cx={16} cy={79} rx={12} ry={8} fill="#fff" />
    <Ellipse cx={84} cy={79} rx={12} ry={8} fill="#fff" />
  </Svg>
);
const Cake = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={20} y={52} width={60} height={32} rx={8} fill="#FFD9A0" />
    <Path d="M20 56 Q30 68 40 56 Q50 68 60 56 Q70 68 80 56 L80 66 L20 66 Z" fill="#FF6B8A" />
    <Rect x={47} y={26} width={6} height={22} rx={3} fill="#7C5CFF" />
    <Ellipse cx={50} cy={24} rx={5} ry={7} fill="#FFC64B" />
  </Svg>
);
const Rocket = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 8 C64 22 68 44 66 62 L34 62 C32 44 36 22 50 8 Z" fill="#fff" stroke="#7C5CFF" strokeWidth={4} />
    <Circle cx={50} cy={36} r={9} fill="#4EC0E4" />
    <Path d="M34 54 L20 74 L34 68 Z" fill="#FF6B8A" />
    <Path d="M66 54 L80 74 L66 68 Z" fill="#FF6B8A" />
    <Path d="M42 64 Q50 92 58 64 Z" fill="#FFA24B" />
  </Svg>
);
const BigStar = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 75 L21 94 L31 61 L4 40 L38 38 Z"
          fill="#FFC64B" stroke="#E8A317" strokeWidth={4} strokeLinejoin="round" />
    <Path d="M50 20 L57 40 L44 40 Z" fill="#fff" opacity={0.45} />
  </Svg>
);
const Trophy = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M30 14 L70 14 L68 46 C68 58 60 66 50 66 C40 66 32 58 32 46 Z" fill="#FFC64B" stroke="#E8A317" strokeWidth={3} />
    <Path d="M30 20 L18 20 C18 38 26 44 33 45" fill="none" stroke="#E8A317" strokeWidth={5} strokeLinecap="round" />
    <Path d="M70 20 L82 20 C82 38 74 44 67 45" fill="none" stroke="#E8A317" strokeWidth={5} strokeLinecap="round" />
    <Rect x={44} y={64} width={12} height={14} fill="#E8A317" />
    <Rect x={30} y={78} width={40} height={10} rx={4} fill="#F0A828" />
    <Circle cx={50} cy={36} r={8} fill="#FF6B8A" />
  </Svg>
);
const Medal = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M34 8 L46 46 L30 52 Z" fill="#4EC0E4" />
    <Path d="M66 8 L54 46 L70 52 Z" fill="#FF6B8A" />
    <Circle cx={50} cy={66} r={26} fill="#FFC64B" stroke="#E8A317" strokeWidth={4} />
    <Circle cx={50} cy={66} r={16} fill="#FFDA86" />
    <Path d="M50 54 L54 63 L64 64 L56 70 L58 80 L50 74 L42 80 L44 70 L36 64 L46 63 Z" fill="#E8A317" />
  </Svg>
);

export const TIERS = { 1: '실버', 2: '골드', 3: '전설' };

const slimeOf = (hat, color) => ({ size }) => <Slime hat={hat} color={color} mood="happy" size={size} />;
const S = (id, n, tier, Draw) => ({ id, n, tier, Draw });

/* 등급이 올라갈수록 귀해진다. 한 판을 다 맞히면 전설부터 뽑히고,
   그렇지 않으면 보통·멋진 쪽에서 먼저 나온다. */
export const STICKERS = [
  S('s-peach',  '분홍 슬라임', 1, slimeOf('plain', 'peach')),
  S('s-mint',   '민트 슬라임', 1, slimeOf('plain', 'mint')),
  S('s-sky',    '하늘 슬라임', 1, slimeOf('plain', 'sky')),
  S('s-butter', '노랑 슬라임', 1, slimeOf('plain', 'butter')),
  S('s-grape',  '보라 슬라임', 1, slimeOf('plain', 'grape')),
  S('s-cocoa',  '초코 슬라임', 1, slimeOf('plain', 'cocoa')),
  S('heart',    '말랑 하트',   1, Heart),
  S('cloud',    '구름',        1, Cloud),
  S('candy',    '사탕',        1, Candy),
  S('sprout',   '새싹',        1, Sprout),

  S('h-peach',  '뿔 슬라임',     2, slimeOf('horn', 'peach')),
  S('h-cocoa',  '초코 뿔 슬라임', 2, slimeOf('horn', 'cocoa')),
  S('b-mint',   '토끼 슬라임',   2, slimeOf('bunny', 'mint')),
  S('b-butter', '노랑 토끼',     2, slimeOf('bunny', 'butter')),
  S('d-sky',    '물방울 슬라임', 2, slimeOf('drop', 'sky')),
  S('rain',     '무지개',        2, Rainbow),
  S('cake',     '케이크',        2, Cake),
  S('rocket',   '로켓',          2, Rocket),

  S('st-butter','별 슬라임',   3, slimeOf('star', 'butter')),
  S('k-grape',  '왕관 슬라임', 3, slimeOf('king', 'grape')),
  S('gold',     '금 슬라임',   3, GoldSlime),
  S('red',      '빨강 슬라임', 3, RedSlime),
  S('bigstar',  '큰 별',       3, BigStar),
  S('crown',    '황금 왕관',   3, ({ size }) => <Crown size={size} />),
  S('trophy',   '트로피',      3, Trophy),
  S('medal',    '메달',        3, Medal),
];

/* ---------- 작은 아이콘 ---------- */
export const Back = ({ size = 23, color = INK }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M62 18 L30 50 L62 82" stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
// 메뉴 카드용 아이콘 — 이모지 대신 이 앱의 그림 스타일(단색 실루엣 +
// 옅은 하이라이트 한 번)로 통일한다.
export const Book = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 24 C42 18 26 16 14 20 L14 78 C26 74 42 76 50 82 Z" fill={color} />
    <Path d="M50 24 C58 18 74 16 86 20 L86 78 C74 74 58 76 50 82 Z" fill={color} opacity={0.78} />
    <Path d="M50 24 L50 82" stroke={color} strokeWidth={2} opacity={0.5} />
    <Path d="M22 34 L42 30 M22 46 L42 43" stroke="#fff" strokeWidth={3} opacity={0.4} strokeLinecap="round" />
  </Svg>
);

// 틀린 낱말 복습 카드용 — 다시 도는 화살표. 다른 아이콘처럼 굵은 스트로크 +
// 화살촉 하나로 단순하게.
export const Refresh = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M78 30 A38 38 0 1 1 26 20"
      stroke={color}
      strokeWidth={11}
      fill="none"
      strokeLinecap="round"
    />
    <Path d="M78 8 L78 32 L54 30 Z" fill={color} />
  </Svg>
);

export const Sparkle = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 10 C52 32 34 46 14 50 C34 54 52 68 50 90 C48 68 66 54 86 50 C66 46 48 32 50 10 Z"
      fill={color}
    />
    <Circle cx={80} cy={22} r={6} fill={color} opacity={0.75} />
    <Circle cx={22} cy={78} r={4.4} fill={color} opacity={0.6} />
  </Svg>
);

// 다른 메뉴 카드가 전부 앱 안 그림(책·반짝임)을 흰 실루엣으로 쓰는데
// 스티커 모음만 리본이라는 낯선 도상이었다 — 정작 화면 안에서 모으는 건
// 슬라임 자신이니, 그 실루엣을 그대로 흰색으로 눌러쓴다. 몸통 윤곽만 있으면
// 무슨 그림인지 안 읽혀서, 왕관(HATS.king 과 같은 모양)을 얹고 눈도 살짝
// 어두운 색으로 비쳐 보이게 뚫어 슬라임임을 한눈에 알아볼 수 있게 했다.
export const SlimeBadge = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M33 20 L36 5 L43 13 L50 2 L57 13 L64 5 L67 20 Z" fill={color} />
    <Path d={BODY} fill={color} />
    <Path d={GLOSS} fill="#000" opacity={0.08} />
    <Ellipse cx={39} cy={63} rx={5} ry={6.3} fill="#000" opacity={0.42} />
    <Ellipse cx={61} cy={63} rx={5} ry={6.3} fill="#000" opacity={0.42} />
  </Svg>
);

export const Pencil = ({ size = 21, color = '#96718F' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M22 78 L26 62 L68 20 L80 32 L38 74 Z" fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" />
    <Path d="M62 26 L74 38" stroke={color} strokeWidth={8} strokeLinecap="round" />
  </Svg>
);
export const Check = ({ size = 25, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M20 52 L42 74 L80 28" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 비슷한말 찾기 메뉴용 — 맞물린 고리 두 개로 "이어짐/비슷함"을 나타낸다.
export const Link = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M38 62 L62 38" stroke={color} strokeWidth={9} strokeLinecap="round" />
    <Path
      d="M46 30 L54 22 C63 13 77 13 86 22 C95 31 95 45 86 54 L78 62"
      fill="none"
      stroke={color}
      strokeWidth={11}
      strokeLinecap="round"
    />
    <Path
      d="M54 70 L46 78 C37 87 23 87 14 78 C5 69 5 55 14 46 L22 38"
      fill="none"
      stroke={color}
      strokeWidth={11}
      strokeLinecap="round"
    />
  </Svg>
);

// 반대말 찾기 메뉴용 — 서로 반대로 향하는 화살표 두 개.
export const Swap = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M18 34 L82 34" stroke={color} strokeWidth={9} strokeLinecap="round" />
    <Path d="M62 16 L82 34 L62 52" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M82 66 L18 66" stroke={color} strokeWidth={9} strokeLinecap="round" />
    <Path d="M38 48 L18 66 L38 84" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// 속담·관용구 퀴즈 메뉴용 — 양 끝이 말린 두루마리.
export const Scroll = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={22} y={24} width={56} height={52} rx={4} fill={color} opacity={0.92} />
    <Path d="M22 24 C14 24 14 40 22 40 L30 40 L30 24 Z" fill={color} />
    <Path d="M78 60 C86 60 86 76 78 76 L70 76 L70 60 Z" fill={color} />
    <Path d="M34 40 L66 40 M34 52 L66 52 M34 64 L58 64" stroke="#000" strokeWidth={3} opacity={0.18} strokeLinecap="round" />
  </Svg>
);
// 실제 사무용 지우개처럼 각진 사각형 대신, 통통한 젤리 지우개로 —
// 위쪽은 밝은 분홍, 아래쪽 닳는 부분은 살짝 어둡게 해서 진짜 지우개
// 느낌을 내면서도 이 앱의 말랑한 톤과 맞춘다. 지워지는 순간의 작은
// 부스러기 점 세 개로 "쓱 지운다"는 느낌을 더했다.
export const Erase = ({ size = 25, color = '#FF9FB0' }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M30 55 L58 27 C63 22 71 22 76 27 L82 33 C87 38 87 46 82 51 L54 79 Z"
      fill={color}
    />
    <Path d="M30 55 L54 79 L36 79 L18 61 Z" fill={color} opacity={0.65} />
    <Path d="M58 27 L84 53" stroke="#fff" strokeWidth={3} opacity={0.55} strokeLinecap="round" />
    <Circle cx={20} cy={72} r={3.4} fill={color} opacity={0.45} />
    <Circle cx={30} cy={80} r={2.6} fill={color} opacity={0.35} />
    <Circle cx={13} cy={62} r={2.2} fill={color} opacity={0.35} />
  </Svg>
);

// 사각 실루엣 대신, 젤리처럼 둥글둥글한 몸통 + 나팔에 하이라이트 한 번,
// 노란 소리 파장 두 겹으로 훨씬 아기자기하게 — 다른 아이콘들(왕관·별)과
// 톤을 맞춰 파랑+노랑 배색을 그대로 가져왔다.
export const Speaker = ({ on = true, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={8} y={34} width={21} height={32} rx={10.5} fill={on ? '#4EC0E4' : '#C7A9C2'} />
    <Path
      d="M28 30 Q52 12 61 18 L61 82 Q52 88 28 70 Z"
      fill={on ? '#4EC0E4' : '#C7A9C2'}
    />
    <Path d="M33 39 Q48 29 54 32 L54 68 Q48 71 33 61 Z" fill="#fff" opacity={0.4} />
    {on ? (
      <G>
        <Path d="M71 36 Q82 50 71 64" stroke="#FFC64B" strokeWidth={8} fill="none" strokeLinecap="round" />
        <Path d="M82 24 Q97 50 82 76" stroke="#FFC64B" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.55} />
        <Circle cx={15} cy={19} r={5.2} fill="#FFC64B" opacity={0.9} />
      </G>
    ) : (
      <Path d="M72 38 L94 62 M94 38 L72 62" stroke="#C7A9C2" strokeWidth={8} strokeLinecap="round" />
    )}
  </Svg>
);
