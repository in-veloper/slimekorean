// 한국어기초사전(krdict) Open API 에서 word-list.js/phrase-list.js 에 적어둔
// 낱말·속담·관용구를 실제로 조회해서 src/data/krwords.json, krphrases.json 으로
// 굽는 빌드 스크립트다. 앱은 실행될 때 이 API 를 전혀 호출하지 않는다 —
// 한 번 구워두면 오프라인에서도 그대로 쓸 수 있고, 정부 API 키도 앱 안에
// 들어갈 필요가 없다.
//
// 사용법: KRDICT_KEY=<발급받은키> node scripts/fetch-krdict.js
const fs = require('fs');
const path = require('path');

const WORDS = require('./word-list');
const PHRASES = require('./phrase-list');

const KEY = process.env.KRDICT_KEY;
if (!KEY) {
  console.error('KRDICT_KEY 환경변수가 필요해요. 예: KRDICT_KEY=xxxx node scripts/fetch-krdict.js');
  process.exit(1);
}

const BASE = 'https://krdict.korean.go.kr/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGet(pathname, params) {
  const url = `${BASE}${pathname}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  return res.text();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : '';
}

function blocks(xml, name) {
  const re = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

async function searchWord(word) {
  const xml = await apiGet('/search', {
    key: KEY,
    q: word,
    part: 'word',
    method: 'exact',
    num: 10,
    start: 1,
  });
  return blocks(xml, 'item').map((item) => ({
    target_code: tag(item, 'target_code'),
    word: decode(tag(item, 'word')),
    pos: decode(tag(item, 'pos')),
    grade: decode(tag(item, 'word_grade')),
  }));
}

async function viewWord(targetCode) {
  const xml = await apiGet('/view', { key: KEY, method: 'target_code', q: targetCode });
  const item = blocks(xml, 'item')[0];
  if (!item) return null;

  const info = tag(item, 'word_info');
  const pronunciation = decode(tag(info, 'pronunciation')) || decode(tag(info, 'word'));
  const senseBlocks = blocks(info, 'sense_info');
  if (!senseBlocks.length) return null;

  // 뜻이 여러 개면 첫 번째(가장 흔한) 뜻만 쓴다 — 퀴즈에서 여러 뜻을 동시에
  // 다루면 아이 입장에서 오히려 헷갈린다.
  const sense = senseBlocks[0];
  const definition = decode(tag(sense, 'definition'));
  if (!definition) return null;

  const examples = blocks(sense, 'example_info')
    .map((e) => decode(tag(e, 'example')))
    .filter(Boolean)
    .filter((e) => e.includes(decode(tag(info, 'word')).replace(/-/g, '')) || true)
    .slice(0, 4);

  return { pronunciation, definition, examples };
}

async function buildWord(word) {
  try {
    const raw = await searchWord(word);
    // "exact" 검색이어도 '풀' 을 찾으면 '풀다/풀리다/풀타임' 처럼 표기가 겹치는
    // 다른 표제어까지 같이 돌려준다 — 글자가 정확히 같은 후보만 남긴다.
    const candidates = raw.filter((c) => c.word === word);
    if (!candidates.length) {
      console.log(`  [skip] ${word} - 정확히 일치하는 표제어 없음`);
      return null;
    }
    // 초급/중급을 우선하고, 없으면 첫 후보를 쓴다.
    const best =
      candidates.find((c) => c.grade === '초급') ||
      candidates.find((c) => c.grade === '중급') ||
      candidates[0];

    await sleep(120);
    const detail = await viewWord(best.target_code);
    if (!detail) {
      console.log(`  [skip] ${word} - 상세 없음`);
      return null;
    }

    return {
      id: best.target_code,
      word: best.word,
      pos: best.pos,
      grade: best.grade || '중급',
      pronunciation: detail.pronunciation,
      definition: detail.definition,
      examples: detail.examples,
    };
  } catch (e) {
    console.log(`  [error] ${word} - ${e.message}`);
    return null;
  }
}

async function buildPhrase(text, kind) {
  try {
    const xml = await apiGet('/search', { key: KEY, q: text, part: 'ip', method: 'exact', num: 10, start: 1 });
    const item = blocks(xml, 'item')[0];
    if (!item) {
      console.log(`  [skip] ${text} - 검색 결과 없음`);
      return null;
    }
    const targetCode = tag(item, 'target_code');
    const word = decode(tag(item, 'word')) || text;
    const definition = decode(tag(blocks(item, 'sense')[0] || '', 'definition'));
    if (!definition) {
      console.log(`  [skip] ${text} - 뜻풀이 없음`);
      return null;
    }

    await sleep(120);
    return { id: targetCode || text, word, kind, definition };
  } catch (e) {
    console.log(`  [error] ${text} - ${e.message}`);
    return null;
  }
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const skipWords = process.env.PHRASES_ONLY === '1';

  let words = [];
  if (skipWords) {
    words = JSON.parse(fs.readFileSync(path.join(dataDir, 'krwords.json'), 'utf8'));
    console.log(`낱말은 기존 ${words.length}개를 그대로 씁니다 (PHRASES_ONLY=1)`);
  } else {
    console.log(`낱말 ${WORDS.length}개 조회 시작...`);
    for (const w of WORDS) {
      const entry = await buildWord(w);
      if (entry) {
        words.push(entry);
        console.log(`  [ok] ${entry.word} (${entry.grade})`);
      }
      await sleep(150);
    }
  }

  console.log(`\n속담 ${PHRASES.proverb.length}개, 관용구 ${PHRASES.idiom.length}개 조회 시작...`);
  const phrases = [];
  for (const p of PHRASES.proverb) {
    const entry = await buildPhrase(p, 'proverb');
    if (entry) {
      phrases.push(entry);
      console.log(`  [ok] ${entry.word}`);
    }
    await sleep(150);
  }
  for (const p of PHRASES.idiom) {
    const entry = await buildPhrase(p, 'idiom');
    if (entry) {
      phrases.push(entry);
      console.log(`  [ok] ${entry.word}`);
    }
    await sleep(150);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'krwords.json'), JSON.stringify(words, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'krphrases.json'), JSON.stringify(phrases, null, 2), 'utf8');

  console.log(`\n완료: 낱말 ${words.length}개 / 속담·관용구 ${phrases.length}개 저장`);
}

main();
