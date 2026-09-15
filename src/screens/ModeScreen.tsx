import { ScrollView, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Book, Check, Erase, Link, Pencil, Refresh, Scroll, SlimeBadge, Sparkle, Swap } from '../art';
import TopBar from '../components/TopBar';
import { Jelly } from '../Jelly';
import { C, darken, F, R } from '../theme';
import { DIFFICULTIES, Profile, QuizKind } from '../types/word';
import { callName } from '../utils/korean';

interface Props {
  profile: Profile;
  onStudy: () => void;
  onQuickQuiz: () => void;
  onKindQuiz: (kind: QuizKind) => void;
  onReview: () => void;
  onOpenStickers: () => void;
  onBack: () => void;
  onWho: () => void;
}

export default function ModeScreen({
  profile,
  onStudy,
  onQuickQuiz,
  onKindQuiz,
  onReview,
  onOpenStickers,
  onBack,
  onWho,
}: Props) {
  const difficultyLabel = DIFFICULTIES.find((d) => d.id === profile.difficulty)?.label ?? '쉬움';
  const wrongCount = profile.progress.wrongWords.length;

  const modes = [
    { id: 'study', color: C.lime, Icon: Book, t: '오늘의 낱말', d: '새 낱말 배우고 발음 듣기', onPress: onStudy },
    { id: 'mix', color: C.tangerine, Icon: Sparkle, t: '실력 뽐내기', d: '여러 문제를 섞어서 테스트', onPress: onQuickQuiz },
    ...(wrongCount > 0
      ? [
          {
            id: 'review',
            color: C.berry,
            Icon: Refresh,
            t: '틀린 낱말 다시 풀기',
            d: `${wrongCount}개 기다리는 중`,
            onPress: onReview,
          },
        ]
      : []),
    {
      id: 'wordToMeaning',
      color: C.sky,
      Icon: Book,
      t: '단어 → 뜻 맞히기',
      d: '낱말을 보고 뜻 고르기',
      onPress: () => onKindQuiz('wordToMeaning'),
    },
    {
      id: 'meaningToWord',
      color: C.grape,
      Icon: Pencil,
      t: '뜻 → 단어 맞히기',
      d: '뜻을 보고 낱말 고르기',
      onPress: () => onKindQuiz('meaningToWord'),
    },
    {
      id: 'initial',
      color: C.tangerine,
      Icon: Check,
      t: '초성 퀴즈',
      d: '초성 힌트로 낱말 맞히기',
      onPress: () => onKindQuiz('initial'),
    },
    {
      id: 'sentenceBlank',
      color: C.gold,
      Icon: Erase,
      t: '문장 빈칸 채우기',
      d: '문장에 알맞은 낱말 고르기',
      onPress: () => onKindQuiz('sentenceBlank'),
    },
    {
      id: 'synonym',
      color: C.sky,
      Icon: Link,
      t: '비슷한말 찾기',
      d: '뜻이 비슷한 낱말 고르기',
      onPress: () => onKindQuiz('synonym'),
    },
    {
      id: 'antonym',
      color: C.berry,
      Icon: Swap,
      t: '반대말 찾기',
      d: '뜻이 반대인 낱말 고르기',
      onPress: () => onKindQuiz('antonym'),
    },
    {
      id: 'phrase',
      color: C.grape,
      Icon: Scroll,
      t: '속담·관용구 퀴즈',
      d: '뜻을 보고 속담·관용구 맞히기',
      onPress: () => onKindQuiz('phrase'),
    },
    { id: 'stickers', color: C.lime, Icon: SlimeBadge, t: '스티커 모음', d: '테스트 볼 때마다 한 장씩', onPress: onOpenStickers },
  ];

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} onWho={onWho} crownCount={profile.progress.completedSteps.length} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{callName(profile.name)}, 무슨 놀이 할까?</Text>
        <Text style={styles.sub}>{difficultyLabel} 낱말로 준비했어요</Text>

        <View style={{ gap: 14, marginTop: 4 }}>
          {modes.map((m) => {
            const Icon = m.Icon;
            return (
              <Jelly key={m.id} color={m.color} dark={darken(m.color)} onPress={m.onPress} inner={styles.mode}>
                <View style={styles.modeIcon}>
                  <Icon size={28} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{m.t}</Text>
                  <Text style={styles.modeDesc}>{m.d}</Text>
                </View>
              </Jelly>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20 },
  bodyContent: { paddingTop: 10, paddingBottom: 24 },
  h1: { fontFamily: F.round, fontSize: 26, color: C.ink, textAlign: 'center', marginTop: 6 },
  sub: { fontFamily: F.hand, fontSize: 17, color: C.inkSoft, textAlign: 'center', marginBottom: 18 },

  mode: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 20 },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: R.md,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: { fontFamily: F.round, fontSize: 20, color: '#fff' },
  modeDesc: { fontFamily: F.hand, fontSize: 15, color: '#fff', opacity: 0.92 },
});
