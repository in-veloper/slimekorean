// semlime 참고해서 팔레트/폰트/젤리 그림자를 그대로 가져왔다 — 우유색
// 배경에 알록달록 젤리 버튼, 손글씨 느낌 설명 텍스트가 이 앱의 "생동감"의
// 핵심이라 색과 폰트 이름까지 최대한 맞춘다.
export const C = {
  milk: '#FFF0F3',
  milkDeep: '#FFE2E9',
  sugar: '#FFFFFF',
  grape: '#7C5CFF',
  berry: '#FF6B8A',
  tangerine: '#FFA24B',
  lime: '#7BD389',
  sky: '#4EC0E4',
  gold: '#FFC64B',
  ink: '#4A2B45',
  inkSoft: '#96718F',
  inkFaint: '#C7A9C2',
};

export const R = { sm: 14, md: 22, lg: 34, xl: 46, pill: 999 };

export const F = {
  round: 'Jua_400Regular', // 한글 본문·제목
  num: 'Fredoka_600SemiBold', // 숫자·영단어
  numBold: 'Fredoka_700Bold',
  hand: 'Gaegu_700Bold', // 손글씨 느낌 설명
};

// 슬라임 색 — 프로필마다 고른다.
export const COLORS = [
  { id: 'peach', main: '#FF9FB0', cheek: '#FF5C82', deep: '#E8788F' },
  { id: 'grape', main: '#A896FF', cheek: '#7C5CFF', deep: '#8B76F0' },
  { id: 'mint', main: '#8FE0B0', cheek: '#4FC98A', deep: '#6DC796' },
  { id: 'sky', main: '#8CD4F0', cheek: '#4EC0E4', deep: '#6BBCDB' },
  { id: 'butter', main: '#FFD97A', cheek: '#FFB937', deep: '#F0C158' },
  { id: 'cocoa', main: '#D9AE85', cheek: '#B8845A', deep: '#C0996F' },
];
export const colorOf = (id) => COLORS.find((c) => c.id === id) || COLORS[0];

export const jellyShadow = {
  shadowColor: '#4A2B45',
  shadowOpacity: 0.2,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
};

export function darken(hex, k = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
