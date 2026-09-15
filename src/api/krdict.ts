import AsyncStorage from '@react-native-async-storage/async-storage';

import { KrPhrase, KrWord, PhraseKind, WordGrade } from '../types/word';

// 국립국어원 한국어기초사전(krdict) Open API. 개인용으로 사이드로드하는
// 앱이라 키를 그냥 파일에 둔다(퍼블리싱 안 함) — 실시간으로 이 API를 직접
// 불러 쓰는 방식을 쓰기로 했다(빌드 시점에 미리 구워두지 않음). 한 번 받은
// 낱말은 AsyncStorage 에 캐시해서, 같은 낱말을 또 찾을 땐 네트워크를 안 탄다.
const KRDICT_KEY = 'A7495E28D4A051BA59E6B89CB1A2F39A';
const BASE = 'https://krdict.korean.go.kr/api';
// 이 UA 헤더가 없으면 서버가 요청 자체를 막는다(브라우저가 아닌 요청으로
// 보고 차단하는 것으로 보임) — curl 로 직접 확인한 사실.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const WORD_CACHE_PREFIX = 'krdict/word/';
const PHRASE_CACHE_PREFIX = 'krdict/phrase/';

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : '';
}

function blocks(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function buildQuery(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

const REQUEST_TIMEOUT_MS = 3500;

// 정부 서버가 가끔(특히 통신사 회선에서) 응답을 아예 안 주고 연결만 물고
// 있는 경우가 있었다 — 타임아웃이 없으면 그 요청 하나 때문에 퀴즈 전체가
// "불러오는 중"에서 영원히 멈춰 버린다. AbortController 로 확실히 끊는다.
async function apiGet(pathname: string, params: Record<string, string | number>): Promise<string> {
  const url = `${BASE}${pathname}?${buildQuery(params)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal });
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function searchWordExact(word: string): Promise<{ target_code: string; word: string; pos: string; grade: string }[]> {
  const xml = await apiGet('/search', { key: KRDICT_KEY, q: word, part: 'word', method: 'exact', num: 10, start: 1 });
  return blocks(xml, 'item')
    .map((item) => ({
      target_code: tag(item, 'target_code'),
      word: decode(tag(item, 'word')),
      pos: decode(tag(item, 'pos')),
      grade: decode(tag(item, 'word_grade')),
    }))
    // "exact" 여도 표기가 겹치는 다른 표제어(풀 -> 풀다/풀리다 등)까지 섞여 온다 —
    // 글자가 완전히 같은 것만 남긴다.
    .filter((c) => c.word === word);
}

async function viewWord(targetCode: string): Promise<{ pronunciation: string; definition: string; examples: string[] } | null> {
  const xml = await apiGet('/view', { key: KRDICT_KEY, method: 'target_code', q: targetCode });
  const item = blocks(xml, 'item')[0];
  if (!item) return null;

  const info = tag(item, 'word_info');
  const pronunciation = decode(tag(info, 'pronunciation')) || decode(tag(info, 'word'));
  const sense = blocks(info, 'sense_info')[0];
  if (!sense) return null;

  const definition = decode(tag(sense, 'definition'));
  if (!definition) return null;

  const examples = blocks(sense, 'example_info')
    .map((e) => decode(tag(e, 'example')))
    .filter(Boolean)
    .slice(0, 4);

  return { pronunciation, definition, examples };
}

async function fetchWordFromApi(word: string): Promise<KrWord | null> {
  const candidates = await searchWordExact(word);
  if (!candidates.length) return null;

  const best =
    candidates.find((c) => c.grade === '초급') ||
    candidates.find((c) => c.grade === '중급') ||
    candidates[0];

  const detail = await viewWord(best.target_code);
  if (!detail || !detail.definition) return null;

  return {
    id: best.target_code,
    word: best.word,
    pos: best.pos,
    grade: (best.grade || '중급') as WordGrade,
    pronunciation: detail.pronunciation,
    definition: detail.definition,
    examples: detail.examples,
  };
}

async function fetchPhraseFromApi(text: string, kind: PhraseKind): Promise<KrPhrase | null> {
  const xml = await apiGet('/search', { key: KRDICT_KEY, q: text, part: 'ip', method: 'exact', num: 10, start: 1 });
  const item = blocks(xml, 'item')[0];
  if (!item) return null;

  const targetCode = tag(item, 'target_code') || text;
  const word = decode(tag(item, 'word')) || text;
  const senseBlock = blocks(item, 'sense')[0];
  const definition = senseBlock ? decode(tag(senseBlock, 'definition')) : '';
  if (!definition) return null;

  return { id: targetCode, word, kind, definition };
}

// 통신사 회선에서 krdict 요청이 가끔 뚜렷한 이유 없이 한 번씩 실패한다
// (타임아웃에 걸리거나 빈 응답) — 그런데 같은 요청을 바로 다시 하면
// 대개 성공한다. 그래서 한 번 실패해도 곧장 한 번 더 시도해 본다.
async function withRetry<T>(fn: () => Promise<T | null>): Promise<T | null> {
  const first = await fn().catch(() => null);
  if (first) return first;
  return fn().catch(() => null);
}

// 캐시에서 먼저 찾고, 없으면 API 를 불러서 캐시에 저장한다.
export async function getWord(word: string): Promise<KrWord | null> {
  const cacheKey = WORD_CACHE_PREFIX + word;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // 캐시 읽기 실패는 무시하고 그냥 API 로 넘어간다.
  }

  const entry = await withRetry(() => fetchWordFromApi(word));
  if (entry) AsyncStorage.setItem(cacheKey, JSON.stringify(entry)).catch(() => undefined);
  return entry;
}

export async function getPhrase(text: string, kind: PhraseKind): Promise<KrPhrase | null> {
  const cacheKey = PHRASE_CACHE_PREFIX + text;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // 무시.
  }

  const entry = await withRetry(() => fetchPhraseFromApi(text, kind));
  if (entry) AsyncStorage.setItem(cacheKey, JSON.stringify(entry)).catch(() => undefined);
  return entry;
}

// 여러 낱말을 한꺼번에 받는다 — 정부 서버에 한번에 너무 많은 요청을
// 몰아치지 않도록 몇 개씩 묶어서(동시 4개) 순서대로 처리한다.
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function getWords(words: string[]): Promise<KrWord[]> {
  const results = await mapWithConcurrency(words, 8, getWord);
  return results.filter((w): w is KrWord => !!w);
}

export async function getPhrases(items: { text: string; kind: PhraseKind }[]): Promise<KrPhrase[]> {
  const results = await mapWithConcurrency(items, 8, (it) => getPhrase(it.text, it.kind));
  return results.filter((p): p is KrPhrase => !!p);
}
