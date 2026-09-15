import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import AnswerButton from '../components/AnswerButton';
import CrownFlyer from '../components/CrownFlyer';
import CircleMark from '../components/FeedbackOverlay';
import ProgressBar from '../components/ProgressBar';
import TopBar from '../components/TopBar';
import { C, F, jellyShadow } from '../theme';
import { Profile, QuizKind, QuizQuestion } from '../types/word';
import { speakKorean } from '../utils/speak';

interface Props {
  profile: Profile;
  questions: QuizQuestion[];
  onFinish: (score: number, correctCount: number, missedWords: string[], cleanWords: string[]) => void;
  onBack: () => void;
}

const NEXT_DELAY = 900;

const HINTS: Record<QuizKind, string> = {
  wordToMeaning: '무슨 뜻일까요?',
  meaningToWord: '무슨 낱말일까요?',
  initial: '초성을 보고 낱말을 맞혀 보세요',
  sentenceBlank: '빈칸에 알맞은 낱말은?',
  synonym: '알맞은 낱말을 골라 보세요',
  antonym: '알맞은 낱말을 골라 보세요',
  phrase: '무슨 속담·관용구일까요?',
};

// 문제 텍스트 길이에 따라 글자 크기를 조절한다 — 낱말 하나(짧음)부터
// 빈칸 문장(김)까지 프롬프트 길이가 제각각이라서 필요하다.
function promptScale(text: string) {
  const len = text.length;
  if (len <= 8) return { fontSize: 40, textAlign: 'center' as const };
  if (len <= 20) return { fontSize: 27, textAlign: 'center' as const };
  if (len <= 45) return { fontSize: 21, textAlign: 'left' as const };
  return { fontSize: 17, textAlign: 'left' as const };
}

export default function QuizScreen({ profile, questions, onFinish, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [wrongSet, setWrongSet] = useState<Set<number>>(new Set());
  const [mood, setMood] = useState<'calm' | 'happy' | 'oops'>('calm');
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [displayCrowns, setDisplayCrowns] = useState(0);
  const [mark, setMark] = useState<{ id: number; x: number; y: number } | null>(null);
  const [flyer, setFlyer] = useState<{ id: number; from: { x: number; y: number }; to: { x: number; y: number } } | null>(
    null
  );
  const [locked, setLocked] = useState(false);

  const tries = useRef(0);
  const markSeq = useRef(0);
  const cardRef = useRef<View>(null);
  const pillPos = useRef<{ x: number; y: number } | null>(null);
  const hop = useRef(new Animated.Value(0)).current;
  const cardShake = useRef(new Animated.Value(0)).current;
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleGuard = useRef(0);
  const missedWords = useRef<Set<string>>(new Set());
  const cleanWords = useRef<Set<string>>(new Set());

  const question = questions[index];

  // 대기 중일 때 가끔 씩 웃었다 돌아온다.
  useEffect(() => {
    const myGuard = ++idleGuard.current;
    function schedule() {
      idleTimer.current = setTimeout(() => {
        if (idleGuard.current !== myGuard) return;
        setMood((m) => {
          if (m !== 'calm') return m;
          setTimeout(() => idleGuard.current === myGuard && setMood('calm'), 900);
          return 'happy';
        });
        schedule();
      }, 4200);
    }
    schedule();
    return () => {
      idleGuard.current++;
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [index]);

  // 화면에 보여줄 문제 텍스트와 소리 내어 읽을 텍스트는 다르다 — 빈칸
  // 문제의 "＿＿＿＿" 를 그대로 읽히면 TTS 가 글자 수만큼 "밑줄"을
  // 반복해서 말해 버린다("밑줄밑줄밑줄밑줄"). 빈칸은 "빈칸"이라는 말
  // 한 번으로 바꾸고, 초성 힌트(자모)는 읽어도 의미가 없어서 아예 빼고
  // 뜻풀이만 읽는다.
  function speak() {
    let text = question.prompt;
    if (question.kind === 'initial') {
      text = question.word.definition;
    } else {
      text = text.replace(/＿+/g, ' 빈칸 ');
    }
    speakKorean(text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  }

  const playHop = useCallback(() => {
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 16 }),
    ]).start();
  }, [hop]);

  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      const score = Math.round((correctSoFar / questions.length) * 100);
      onFinish(score, correctSoFar, [...missedWords.current], [...cleanWords.current]);
      return;
    }
    setIndex((i) => i + 1);
    setWrongSet(new Set());
    setMood('calm');
    setLocked(false);
    tries.current = 0;
  }, [index, questions.length, correctSoFar, onFinish]);

  function handleAnswer(option: string, optionIndex: number) {
    if (locked || wrongSet.has(optionIndex)) return;
    const isCorrect = option === question.answer;

    if (isCorrect) {
      setLocked(true);
      const clean = tries.current === 0;
      if (clean) {
        setCorrectSoFar((c) => c + 1);
        cleanWords.current.add(question.word.word);
      } else {
        missedWords.current.add(question.word.word);
      }
      setMood('happy');
      playHop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      cardRef.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
        const center = { x: x + w / 2, y: y + h / 2 };
        setMark({ id: ++markSeq.current, x: center.x, y: center.y });
        if (pillPos.current) {
          setFlyer({ id: markSeq.current, from: center, to: pillPos.current });
        } else {
          setDisplayCrowns((c) => c + 1);
        }
      });

      setTimeout(next, NEXT_DELAY);
    } else {
      tries.current += 1;
      missedWords.current.add(question.word.word);
      setWrongSet((prev) => new Set(prev).add(optionIndex));
      setMood('oops');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      cardShake.setValue(0);
      Animated.sequence([
        Animated.timing(cardShake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0.6, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();

      setTimeout(() => setMood((m) => (m === 'oops' ? 'calm' : m)), 620);
    }
  }

  const hopStyle = {
    transform: [
      { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) },
      { scaleY: hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.88, 1.08] }) },
    ],
  };
  const cardShakeStyle = {
    transform: [{ translateX: cardShake.interpolate({ inputRange: [-1, 1], outputRange: [-11, 11] }) }],
  };
  const scale = promptScale(question.prompt);

  return (
    <View style={styles.screen}>
      <TopBar
        profile={profile}
        showBack
        onBack={onBack}
        crownCount={displayCrowns}
        onPillLayout={(pos) => {
          pillPos.current = pos;
        }}
      />

      <View style={styles.body}>
        <ProgressBar current={index + 1} total={questions.length} />

        <Animated.View ref={cardRef} style={[styles.card, cardShakeStyle]}>
          <Animated.View style={[styles.mascot, hopStyle]}>
            <Slime hat={profile.hat} color={profile.color} mood={mood} size={78} />
          </Animated.View>

          <Pressable style={styles.wordBox} onPress={speak}>
            <Text style={[styles.wordText, { fontSize: scale.fontSize, textAlign: scale.textAlign }]}>
              {question.prompt}
            </Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={26} />
            </View>
          </Pressable>

          <Text style={styles.hint}>{HINTS[question.kind]}</Text>
        </Animated.View>

        <View style={styles.answers}>
          <View style={styles.row}>
            {question.options.slice(0, 2).map((opt, i) => (
              <AnswerButton
                key={`${index}-${i}`}
                label={opt}
                onPress={() => handleAnswer(opt, i)}
                feedback={wrongSet.has(i) ? 'wrong' : null}
                disabled={locked || wrongSet.has(i)}
                colorIndex={i}
              />
            ))}
          </View>
          <View style={styles.row}>
            {question.options.slice(2, 4).map((opt, i) => (
              <AnswerButton
                key={`${index}-${i + 2}`}
                label={opt}
                onPress={() => handleAnswer(opt, i + 2)}
                feedback={wrongSet.has(i + 2) ? 'wrong' : null}
                disabled={locked || wrongSet.has(i + 2)}
                colorIndex={i + 2}
              />
            ))}
          </View>
        </View>
      </View>

      {mark ? <CircleMark key={mark.id} x={mark.x} y={mark.y} size={200} /> : null}
      {flyer ? (
        <CrownFlyer
          key={flyer.id}
          from={flyer.from}
          to={flyer.to}
          onArrive={() => {
            setDisplayCrowns((c) => c + 1);
            setFlyer(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },

  card: {
    flex: 1,
    backgroundColor: C.sugar,
    borderRadius: 46,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 52,
    ...jellyShadow,
    shadowOpacity: 0.18,
  },
  mascot: { position: 'absolute', top: -44, alignSelf: 'center', zIndex: 2 },

  wordBox: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 14 },
  wordText: { flex: 1, fontFamily: F.round, color: C.ink, lineHeight: undefined },
  speakerBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontFamily: F.hand, fontSize: 16, color: C.inkSoft, textAlign: 'center' },

  answers: { gap: 14, marginTop: 16 },
  row: { flexDirection: 'row', gap: 14 },
});
