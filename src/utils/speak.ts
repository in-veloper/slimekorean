import * as Speech from 'expo-speech';

// slimewords 는 기기 TTS 가 영어 단어를 한글식으로 잘못 읽는 문제 때문에
// 구글 TTS 를 써야 했다 — 여기는 한국어 낱말을 한국어 음성으로 읽는 것뿐이라
// 그 문제 자체가 없다. 기기 내장 한국어 TTS 로 충분하다.
let cachedVoiceId: string | null | undefined;

async function resolveKoreanVoice(): Promise<string | null> {
  if (cachedVoiceId !== undefined) return cachedVoiceId;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const korean = voices.filter((v) => v.language?.toLowerCase().startsWith('ko'));
    const best =
      korean.find((v) => v.language?.toLowerCase() === 'ko-kr') ||
      korean.find((v) => v.language?.toLowerCase().startsWith('ko-kr')) ||
      korean[0];
    cachedVoiceId = best?.identifier ?? null;
  } catch {
    cachedVoiceId = null;
  }
  return cachedVoiceId;
}

export async function speakKorean(text: string) {
  if (!text) return;
  Speech.stop();
  const voice = await resolveKoreanVoice();
  Speech.speak(text, { language: 'ko-KR', voice: voice ?? undefined, pitch: 1.0, rate: 0.92 });
}
