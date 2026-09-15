import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Gaegu_700Bold } from '@expo-google-fonts/gaegu';

// @ts-ignore - art.js 는 순수 JS.
import { Slime } from './src/art';
import { getWords } from './src/api/krdict';
import ProfileModal from './src/components/ProfileModal';
import HomeScreen from './src/screens/HomeScreen';
import ModeScreen from './src/screens/ModeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import StickerScreen from './src/screens/StickerScreen';
import StudyScreen from './src/screens/StudyScreen';
import {
  addProfile,
  completeStep,
  loadActiveProfileId,
  loadProfiles,
  removeProfile,
  resetProgress,
  setActiveProfileId,
  suggestColor,
  updateProfile,
} from './src/storage/wordStorage';
import { C, F } from './src/theme';
import { DEFAULT_QUIZ_LENGTH, Difficulty, KrWord, Profile, QuizKind, QuizQuestion } from './src/types/word';
import { getRandomWords, getStepWords } from './src/utils/dayWords';
import {
  buildAntonymQuiz,
  buildInitialQuiz,
  buildMeaningToWordQuiz,
  buildMixedQuiz,
  buildPhraseQuiz,
  buildSentenceBlankQuiz,
  buildSynonymQuiz,
  buildWordQuiz,
  buildWordToMeaningQuiz,
} from './src/utils/quiz';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MAX_PROFILES = 8;

type Screen = 'pick' | 'menu' | 'study' | 'quiz' | 'result' | 'stickers';

interface QuizResult {
  step: number;
  words: KrWord[];
  totalCount: number;
  score: number;
  correctCount: number;
  passed: boolean;
  earnedStickerId: string | null;
}

export default function App() {
  const [fontsReady] = useFonts({ Jua_400Regular, Fredoka_600SemiBold, Fredoka_700Bold, Gaegu_700Bold });
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('pick');
  const [busy, setBusy] = useState(false); // 사전 API 불러오는 동안 보여줄 로딩 표시

  const [profileModal, setProfileModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  });

  const [playingStep, setPlayingStep] = useState(0);
  const [playingWords, setPlayingWords] = useState<KrWord[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    (async () => {
      const savedProfiles = await loadProfiles();
      const savedActive = await loadActiveProfileId();
      if (savedProfiles.length > 0) {
        setProfiles(savedProfiles);
        const validActive = savedProfiles.find((p) => p.id === savedActive);
        if (validActive) setActiveId(validActive.id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (fontsReady && !loading) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, loading]);

  const activeProfile = profiles.find((p) => p.id === activeId) || null;
  const editingProfile = profileModal.editingId ? profiles.find((p) => p.id === profileModal.editingId) : null;

  const handleSaveProfile = useCallback(
    async (data: { name: string; hat: string; color: string; difficulty: Difficulty; quizLength: number }) => {
      if (profileModal.editingId) {
        const next = await updateProfile(profileModal.editingId, data);
        setProfiles(next);
      } else {
        const created = await addProfile(data.name, data.color, data.hat);
        const newProfile = created[created.length - 1];
        const next = await updateProfile(newProfile.id, data);
        setProfiles(next);
        await setActiveProfileId(newProfile.id);
        setActiveId(newProfile.id);
      }
      setProfileModal({ open: false, editingId: null });
    },
    [profileModal.editingId]
  );

  const handlePick = useCallback(async (id: string) => {
    await setActiveProfileId(id);
    setActiveId(id);
    setScreen('menu');
  }, []);

  const handleRemoveProfile = useCallback(async (id: string) => {
    const next = await removeProfile(id);
    setProfiles(next);
    setProfileModal({ open: false, editingId: null });
    setScreen('pick');
  }, []);

  const handleResetProgress = useCallback(async (id: string) => {
    const next = await resetProgress(id);
    setProfiles(next);
  }, []);

  // 낱말을 하나도 못 받아 왔을 때(인터넷이 안 되거나, krdict 서버가 응답이
  // 없을 때) 그대로 진행하면 문제를 하나도 못 만든 빈 테스트 화면이 뜬다 —
  // 대신 화면 전환을 멈추고 다시 시도하라고 알려준다.
  function warnFetchFailed() {
    Alert.alert('낱말을 못 불러왔어요', '인터넷 연결을 확인하고 다시 시도해 주세요.');
  }

  const startStudy = useCallback(async () => {
    if (!activeProfile) return;
    setBusy(true);
    const step = activeProfile.progress.currentStep;
    const words = await getStepWords(step, activeProfile.difficulty);
    setBusy(false);
    if (words.length === 0) {
      warnFetchFailed();
      return;
    }
    setPlayingStep(step);
    setPlayingWords(words);
    setScreen('study');
  }, [activeProfile]);

  const startQuiz = useCallback(async () => {
    setBusy(true);
    const quizLength = activeProfile?.quizLength ?? DEFAULT_QUIZ_LENGTH;
    const built = await buildWordQuiz(playingWords, quizLength);
    setBusy(false);
    if (built.length === 0) {
      warnFetchFailed();
      return;
    }
    setQuiz(built);
    setScreen('quiz');
  }, [playingWords, activeProfile]);

  // "실력 뽐내기" — 학습 화면을 거치지 않고 곧장 여러 종류의 문제(단어/뜻,
  // 초성, 문장 빈칸, 비슷한말/반대말, 속담·관용구)를 섞어서 낸다.
  const startQuickQuiz = useCallback(async () => {
    if (!activeProfile) return;
    setBusy(true);
    const step = activeProfile.progress.currentStep;
    const quizLength = activeProfile.quizLength ?? DEFAULT_QUIZ_LENGTH;
    const words = await getRandomWords(quizLength);
    if (words.length === 0) {
      setBusy(false);
      warnFetchFailed();
      return;
    }
    const mixed = await buildMixedQuiz(words, quizLength);
    setBusy(false);
    if (mixed.length === 0) {
      warnFetchFailed();
      return;
    }
    setPlayingStep(step);
    setPlayingWords(words);
    setQuiz(mixed);
    setScreen('quiz');
  }, [activeProfile]);

  // 메뉴에서 특정 문제 종류 하나를 골랐을 때 — 종류에 따라 필요한 낱말 곳간
  // 크기가 달라서(문장 빈칸은 걸러지는 낱말이 많아 더 넉넉히 받아야 한다)
  // 종류별로 나눠 처리한다.
  const startKindQuiz = useCallback(
    async (kind: QuizKind) => {
      if (!activeProfile) return;
      setBusy(true);
      const step = activeProfile.progress.currentStep;
      const quizLength = activeProfile.quizLength ?? DEFAULT_QUIZ_LENGTH;

      let words: KrWord[] = [];
      let built: QuizQuestion[] = [];

      if (kind === 'synonym' || kind === 'antonym' || kind === 'phrase') {
        // 이 종류들은 words 자체가 문제의 답이 아니라 오답 보기용 낱말
        // 곳간으로만 쓰인다(속담은 그마저도 필요 없다).
        words = kind === 'phrase' ? [] : await getRandomWords(15);
        if (kind === 'synonym') built = await buildSynonymQuiz(words, quizLength);
        else if (kind === 'antonym') built = await buildAntonymQuiz(words, quizLength);
        else built = await buildPhraseQuiz(quizLength);
      } else if (kind === 'sentenceBlank') {
        // 사전형이 예문에 그대로 없는 낱말은 걸러지기 때문에 넉넉히 받는다.
        words = await getRandomWords(quizLength * 3);
        built = await buildSentenceBlankQuiz(words, quizLength);
      } else {
        words = await getRandomWords(quizLength);
        if (kind === 'wordToMeaning') built = await buildWordToMeaningQuiz(words, quizLength);
        else if (kind === 'meaningToWord') built = await buildMeaningToWordQuiz(words, quizLength);
        else built = await buildInitialQuiz(words, quizLength);
      }

      setBusy(false);
      if (built.length === 0) {
        warnFetchFailed();
        return;
      }
      setPlayingStep(step);
      setPlayingWords(words);
      setQuiz(built);
      setScreen('quiz');
    },
    [activeProfile]
  );

  // "틀린 낱말 다시 풀기" — wrongWords 에 쌓인 낱말들로만 테스트를 만든다.
  const startReview = useCallback(async () => {
    if (!activeProfile) return;
    setBusy(true);
    const step = activeProfile.progress.currentStep;
    const targets = activeProfile.progress.wrongWords;
    const words = await getWords(targets);
    if (words.length === 0) {
      setBusy(false);
      warnFetchFailed();
      return;
    }
    const built = await buildWordQuiz(words, words.length);
    setBusy(false);
    if (built.length === 0) {
      warnFetchFailed();
      return;
    }
    setPlayingStep(step);
    setPlayingWords(words);
    setQuiz(built);
    setScreen('quiz');
  }, [activeProfile]);

  const finishQuiz = useCallback(
    async (score: number, correctCount: number, missedWords: string[], cleanWords: string[]) => {
      if (!activeProfile) return;
      const applied = await completeStep(activeProfile.id, playingStep, score, playingWords.length, missedWords, cleanWords);
      if (applied) {
        setProfiles(applied.profiles);
        setResult({
          step: playingStep,
          words: playingWords,
          totalCount: quiz.length,
          score,
          correctCount,
          passed: applied.passed,
          earnedStickerId: applied.earnedStickerId,
        });
      }
      setScreen('result');
    },
    [activeProfile, playingStep, playingWords, quiz.length]
  );

  if (loading || !fontsReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safe, { backgroundColor: C.milk }]} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
        <StatusBar style="dark" />

        {screen === 'pick' && (
          <HomeScreen
            profiles={profiles}
            onPick={handlePick}
            onEdit={(id) => setProfileModal({ open: true, editingId: id })}
            onAdd={() => setProfileModal({ open: true, editingId: null })}
            canAdd={profiles.length < MAX_PROFILES}
          />
        )}

        {screen === 'menu' && activeProfile && (
          <ModeScreen
            profile={activeProfile}
            onStudy={startStudy}
            onQuickQuiz={startQuickQuiz}
            onKindQuiz={startKindQuiz}
            onReview={startReview}
            onOpenStickers={() => setScreen('stickers')}
            onBack={() => setScreen('pick')}
            onWho={() => setProfileModal({ open: true, editingId: activeProfile.id })}
          />
        )}

        {screen === 'study' && activeProfile && (
          <StudyScreen profile={activeProfile} words={playingWords} onDone={startQuiz} onBack={() => setScreen('menu')} />
        )}

        {screen === 'quiz' && activeProfile && (
          <QuizScreen profile={activeProfile} questions={quiz} onFinish={finishQuiz} onBack={() => setScreen('menu')} />
        )}

        {screen === 'result' && activeProfile && result && (
          <ResultScreen
            profile={activeProfile}
            score={result.score}
            correctCount={result.correctCount}
            totalCount={result.totalCount}
            passed={result.passed}
            earnedStickerId={result.earnedStickerId}
            onRetry={async () => {
              setBusy(true);
              const built = await buildWordQuiz(result.words, activeProfile.quizLength ?? DEFAULT_QUIZ_LENGTH);
              setBusy(false);
              if (built.length === 0) {
                warnFetchFailed();
                return;
              }
              setQuiz(built);
              setScreen('quiz');
            }}
            onHome={() => setScreen('menu')}
            onStickers={() => setScreen('stickers')}
          />
        )}

        {screen === 'stickers' && activeProfile && (
          <StickerScreen profile={activeProfile} onBack={() => setScreen('menu')} />
        )}
      </SafeAreaView>

      {busy && activeProfile ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <Slime hat={activeProfile.hat} color={activeProfile.color} mood="happy" size={90} />
          <Text style={styles.busyText}>사전에서 낱말을 불러오는 중...</Text>
        </View>
      ) : null}

      <ProfileModal
        visible={profileModal.open}
        isNew={!profileModal.editingId}
        initial={
          editingProfile
            ? {
                name: editingProfile.name,
                hat: editingProfile.hat,
                color: editingProfile.color,
                difficulty: editingProfile.difficulty,
                quizLength: editingProfile.quizLength ?? DEFAULT_QUIZ_LENGTH,
              }
            : { name: '', hat: 'plain', color: suggestColor(profiles), difficulty: 'easy', quizLength: DEFAULT_QUIZ_LENGTH }
        }
        onClose={() => setProfileModal({ open: false, editingId: null })}
        onSave={handleSaveProfile}
        onReset={editingProfile ? () => handleResetProgress(editingProfile.id) : undefined}
        onDelete={editingProfile ? () => handleRemoveProfile(editingProfile.id) : undefined}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  busyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,240,243,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  busyText: { fontFamily: F.hand, fontSize: 17, color: C.inkSoft },
});
