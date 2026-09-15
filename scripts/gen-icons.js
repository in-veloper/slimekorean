const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// slimewords 의 슬라임 몸통/장식 그대로 — 아이콘도 앱 안 마스코트와
// 똑같이 생기도록 같은 SVG path 를 그대로 쓴다.
const BODY =
  'M50 20 C57 41 86 53 86 70 C86 80 75 87 62 87 C58 87 57 84.5 53 84.5 ' +
  'C49 84.5 48 87 44 87 C31 87 14 80 14 70 C14 53 43 41 50 20 Z';
const GLOSS = 'M27 64 C30 54 40 45 48 42 C39 49 31 58 28 68 Z';

const MAIN = '#FF9FB0';
const CHEEK = '#FF5C82';
const INK = '#4A2B45';

// 슬라임 영단어(분홍) · 슬라임 수학(하늘색)과 한눈에 구분되도록 이 앱은
// 따뜻한 노랑 계열 배경을 쓴다. 슬라임 캐릭터 자체 색은 세 앱이 같은
// 시리즈라는 걸 알아볼 수 있게 그대로 둔다.
const BG_LIGHT = '#FFF3C4';
const BG_DEEP = '#FFDD8C';

// 한글 학습 앱이라는 걸 아이콘만 봐도 알 수 있게, 자음들을 슬라임 뒤로
// 흩뿌린다 — 너무 또렷하면 슬라임이랑 부딪히니 낮은 투명도로 깔아준다.
//
// 안드로이드 적응형 아이콘은 런처마다 원/둥근네모 등 다른 모양으로 잘라
// 보여준다 — 중심(50,50)에서 반지름 33을 넘어가는 내용은 가장자리
// 마스크에 잘려서 실제 기기에선 아예 안 보인다(처음엔 가장자리에 글자를
// 놨다가 전부 잘려서 하나도 안 보이는 문제가 있었다). 그래서 반지름
// 24~31 사이, 안전 영역 안쪽에서만 원형으로 고르게 배치한다.
const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ'];
const LETTER_SPOTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = i % 2 === 0 ? 24 : 31;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return {
    ch: CONSONANTS[i % CONSONANTS.length],
    x,
    y,
    size: i % 2 === 0 ? 13 : 15,
    rot: Math.round((angle * 180) / Math.PI) % 30,
  };
});

function letters(opacity = 0.4) {
  return LETTER_SPOTS.map(
    ({ ch, x, y, size, rot }) => `
      <text x="${x}" y="${y}" font-size="${size}" font-family="sans-serif" font-weight="700"
        fill="${INK}" opacity="${opacity}" text-anchor="middle"
        transform="rotate(${rot} ${x} ${y})">${ch}</text>
    `
  ).join('');
}

function slime() {
  return `
    <path d="${BODY}" fill="${MAIN}" />
    <path d="${GLOSS}" fill="#fff" opacity="0.55" />
    <ellipse cx="50" cy="84" rx="30" ry="4" fill="${CHEEK}" opacity="0.35" />
    <ellipse cx="27" cy="73" rx="6.6" ry="4.3" fill="${CHEEK}" opacity="0.75" />
    <ellipse cx="73" cy="73" rx="6.6" ry="4.3" fill="${CHEEK}" opacity="0.75" />
    <ellipse cx="39" cy="63" rx="5" ry="6.3" fill="${INK}" />
    <ellipse cx="61" cy="63" rx="5" ry="6.3" fill="${INK}" />
    <circle cx="41" cy="60.6" r="1.8" fill="#fff" />
    <circle cx="63" cy="60.6" r="1.8" fill="#fff" />
    <path d="M37 72 Q50 88 63 72 Z" fill="${INK}" />
    <path d="M44 79 Q50 84 56 79" fill="#FF8FA8" />
  `;
}

function svg({ size, viewBox = '0 0 100 100', content, background }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${
    background || ''
  }${content}</svg>`;
}

async function main() {
  const iconSvg = svg({
    size: 1024,
    background: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${BG_LIGHT}" />
          <stop offset="1" stop-color="${BG_DEEP}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bg)" />
      ${letters(0.4)}
    `,
    content: slime(),
  });
  await sharp(Buffer.from(iconSvg)).png().toFile(path.join(ASSETS, 'icon.png'));

  const fgSvg = svg({ size: 432, viewBox: '-18 -18 136 136', content: slime() });
  await sharp(Buffer.from(fgSvg)).resize(432, 432).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  const bgSvg = svg({
    size: 432,
    background: `
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${BG_LIGHT}" />
          <stop offset="1" stop-color="${BG_DEEP}" />
        </linearGradient>
      </defs>
      <rect width="432" height="432" fill="url(#bg2)" />
    `,
    content: letters(0.5),
  });
  await sharp(Buffer.from(bgSvg)).png().toFile(path.join(ASSETS, 'android-icon-background.png'));

  const monoSvg = svg({
    size: 432,
    viewBox: '-18 -18 136 136',
    content: `<path d="${BODY}" fill="#FFFFFF" />`,
  });
  await sharp(Buffer.from(monoSvg)).resize(432, 432).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  const splashSvg = svg({ size: 600, viewBox: '-10 -10 120 120', content: slime() });
  await sharp(Buffer.from(splashSvg)).resize(600, 600).png().toFile(path.join(ASSETS, 'splash-icon.png'));

  const faviconSvg = svg({
    size: 48,
    background: `<rect width="100" height="100" rx="18" fill="${BG_DEEP}" />${letters(0.4)}`,
    content: slime(),
  });
  await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));

  console.log('아이콘 생성 완료');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
