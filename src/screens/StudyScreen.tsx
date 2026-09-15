import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import { Jelly } from '../Jelly';
import { C, darken, F, R, jellyShadow } from '../theme';
import { KrWord, Profile } from '../types/word';
import { speakKorean } from '../utils/speak';

interface Props {
  profile: Profile;
  words: KrWord[];
  onDone: () => void;
  onBack: () => void;
}

// "오늘의 낱말" — 새 낱말을 하나씩 보여주고, 발음을 듣고, 눌러서 뜻과
// 예문을 확인한다. 다 보면 곧바로 테스트로 이어진다.
export default function StudyScreen({ profile, words, onDone, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mood, setMood] = useState<'calm' | 'happy'>('calm');
  const word = words[index];
  const isLast = index === words.length - 1;
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setMood((m) => (m === 'calm' ? 'happy' : m));
      setTimeout(() => setMood((m) => (m === 'happy' ? 'calm' : m)), 900);
    }, 4200);
    return () => clearInterval(timer);
  }, [index]);

  function speak() {
    speakKorean(word.word);
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 16 }),
    ]).start();
  }

  function next() {
    if (isLast) {
      onDone();
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  if (!word) return null;

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.body}>
        <ProgressBar current={index + 1} total={words.length} />

        <View style={styles.card}>
          <Animated.View
            style={[
              styles.mascot,
              {
                transform: [
                  { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                  { scaleY: hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.9, 1.06] }) },
                ],
              },
            ]}
          >
            <Slime hat={profile.hat} color={profile.color} mood="happy" size={72} />
          </Animated.View>

          <Pressable style={styles.wordBox} onPress={speak}>
            <Text style={styles.wordText}>{word.word}</Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={30} />
            </View>
          </Pressable>
          <Text style={styles.gradeTag}>{word.pos} · {word.grade}</Text>

          <Jelly
            color={C.sky}
            dark={darken(C.sky)}
            onPress={() => setRevealed((r) => !r)}
            style={styles.revealWrap}
            inner={styles.revealInner}
          >
            <Text style={styles.revealText}>{revealed ? '뜻 숨기기' : '뜻 보기'}</Text>
          </Jelly>

          {revealed ? (
            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.definition}>{word.definition}</Text>
              {word.examples.slice(0, 2).map((ex, i) => (
                <Text key={i} style={styles.example}>
                  · {ex}
                </Text>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <Jelly color={C.lime} dark={darken(C.lime)} onPress={next} style={styles.ctaWrap} inner={styles.cta}>
          <Text style={styles.ctaText}>{isLast ? '🧪 테스트 보러 가기' : '다음 낱말'}</Text>
        </Jelly>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },

  card: {
    flex: 1,
    backgroundColor: C.sugar,
    borderRadius: R.xl,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 52,
    ...jellyShadow,
    shadowOpacity: 0.18,
  },
  mascot: { position: 'absolute', top: -52, alignSelf: 'center', zIndex: 2 },

  wordBox: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 6 },
  wordText: { fontFamily: F.round, fontSize: 42, color: C.ink },
  speakerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeTag: { fontFamily: F.hand, fontSize: 14, color: C.inkFaint, marginBottom: 14 },

  revealWrap: { marginBottom: 14 },
  revealInner: { paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  revealText: { fontFamily: F.round, fontSize: 18, color: '#fff' },

  detailScroll: { width: '100%', flex: 1 },
  definition: { fontFamily: F.hand, fontSize: 19, color: C.ink, textAlign: 'center', lineHeight: 27, marginBottom: 10 },
  example: { fontFamily: F.hand, fontSize: 15, color: C.inkSoft, lineHeight: 22, marginBottom: 4 },

  ctaWrap: { width: '100%', marginTop: 16 },
  cta: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontFamily: F.round, fontSize: 19, color: '#fff' },
});
