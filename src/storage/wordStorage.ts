import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - art.js 는 순수 JS.
import { HAT_IDS } from '../art';
import { DEFAULT_QUIZ_LENGTH, Difficulty, Profile } from '../types/word';
import { pickSticker } from '../utils/stickers';

const PROFILES_KEY = 'slimekorean/profiles';
const ACTIVE_KEY = 'slimekorean/activeProfileId';

const PASS_SCORE = 70;
const COLOR_IDS = ['peach', 'grape', 'mint', 'sky', 'butter', 'cocoa'];

function newProfile(name: string, color: string, hat: string): Profile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    hat: HAT_IDS.includes(hat) ? hat : 'plain',
    color,
    difficulty: 'easy',
    quizLength: DEFAULT_QUIZ_LENGTH,
    progress: { currentStep: 0, completedSteps: [], learnedWordCount: 0, stickers: [], wrongWords: [] },
  };
}

// 예전 버전에서 만든 프로필엔 stickers/quizLength/wrongWords 필드가 없을 수
// 있다 — 없으면 기본값으로 채워서 항상 있다고 믿고 코드를 짤 수 있게 한다.
function normalize(profile: Profile): Profile {
  const needsStickers = !Array.isArray(profile.progress.stickers);
  const needsQuizLength = typeof profile.quizLength !== 'number';
  const needsWrongWords = !Array.isArray((profile.progress as any).wrongWords);
  if (!needsStickers && !needsQuizLength && !needsWrongWords) return profile;
  return {
    ...profile,
    quizLength: needsQuizLength ? DEFAULT_QUIZ_LENGTH : profile.quizLength,
    progress: {
      ...profile.progress,
      stickers: needsStickers ? [] : profile.progress.stickers,
      wrongWords: needsWrongWords ? [] : profile.progress.wrongWords,
    },
  };
}

export async function loadProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const parsed: Profile[] = raw ? JSON.parse(raw) : [];
    return parsed.map(normalize);
  } catch {
    return [];
  }
}

async function saveProfiles(profiles: Profile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function loadActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export function suggestColor(existing: Profile[]): string {
  const used = new Set(existing.map((p) => p.color));
  return COLOR_IDS.find((c) => !used.has(c)) || COLOR_IDS[0];
}

export async function addProfile(name: string, color: string, hat = 'plain'): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = [...profiles, newProfile(name, color, hat)];
  await saveProfiles(next);
  return next;
}

export async function removeProfile(id: string): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.filter((p) => p.id !== id);
  await saveProfiles(next);
  return next;
}

export async function setDifficulty(profileId: string, difficulty: Difficulty): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) => (p.id === profileId ? { ...p, difficulty } : p));
  await saveProfiles(next);
  return next;
}

export async function updateProfile(
  profileId: string,
  patch: { name: string; hat: string; color: string; difficulty: Difficulty; quizLength: number }
): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) => (p.id === profileId ? { ...p, ...patch } : p));
  await saveProfiles(next);
  return next;
}

export async function resetProgress(profileId: string): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) =>
    p.id === profileId
      ? { ...p, progress: { currentStep: 0, completedSteps: [], learnedWordCount: 0, stickers: [], wrongWords: [] } }
      : p
  );
  await saveProfiles(next);
  return next;
}

// 테스트를 보고 나면 여기로 온다. 통과(70점 이상)할 때마다 스티커를 한 장
// 받는다. missedWords 는 이번 판에서 한 번이라도 틀렸던 낱말들, cleanWords
// 는 첫 시도에 바로 맞힌 낱말들 — 틀린 목록에 쌓고 빼는 데 쓴다.
export async function completeStep(
  profileId: string,
  step: number,
  score: number,
  wordCount: number,
  missedWords: string[] = [],
  cleanWords: string[] = []
): Promise<{ profiles: Profile[]; passed: boolean; advanced: boolean; earnedStickerId: string | null } | null> {
  const profiles = await loadProfiles();
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx < 0) return null;

  const profile = profiles[idx];
  const passed = score >= PASS_SCORE;
  const alreadyDone = profile.progress.completedSteps.some((s) => s.step === step);
  const isCurrent = step === profile.progress.currentStep;
  const advanced = passed && isCurrent && !alreadyDone;

  const earnedSticker = passed ? pickSticker(profile.progress.stickers) : null;
  const earnedStickerId: string | null = earnedSticker?.id ?? null;
  const nextStickers = earnedStickerId ? [...profile.progress.stickers, earnedStickerId] : profile.progress.stickers;

  const wrongSet = new Set(profile.progress.wrongWords);
  missedWords.forEach((w) => wrongSet.add(w));
  cleanWords.forEach((w) => wrongSet.delete(w));

  const nextRecords = alreadyDone
    ? profile.progress.completedSteps.map((s) => (s.step === step && score > s.score ? { ...s, score } : s))
    : passed
      ? [...profile.progress.completedSteps, { step, score, earnedAt: Date.now() }]
      : profile.progress.completedSteps;

  const nextProfile: Profile = {
    ...profile,
    progress: {
      currentStep: advanced ? profile.progress.currentStep + 1 : profile.progress.currentStep,
      completedSteps: nextRecords,
      learnedWordCount: advanced ? profile.progress.learnedWordCount + wordCount : profile.progress.learnedWordCount,
      stickers: nextStickers,
      wrongWords: [...wrongSet],
    },
  };

  const nextProfiles = [...profiles];
  nextProfiles[idx] = nextProfile;
  await saveProfiles(nextProfiles);

  return { profiles: nextProfiles, passed, advanced, earnedStickerId };
}
