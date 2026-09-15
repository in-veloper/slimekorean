import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { STICKERS, Slime } from '../art';
import { Jelly } from '../Jelly';
import { C, darken, F } from '../theme';
import { Profile } from '../types/word';

interface Props {
  profile: Profile;
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  earnedStickerId: string | null;
  onRetry: () => void;
  onHome: () => void;
  onStickers: () => void;
}

// semlime 의 DoneScreen 그대로 — 테스트를 마치면(통과든 아니든) 곧장 이
// 화면이 뜨고, 통과했으면 방금 받은 스티커가 크게 튀어 나온다. "스티커
// 모음" 버튼을 늘 보여줘서 전체 컬렉션으로 바로 넘어갈 수 있게 한다.
export default function ResultScreen({
  profile,
  score,
  correctCount,
  totalCount,
  passed,
  earnedStickerId,
  onRetry,
  onHome,
  onStickers,
}: Props) {
  const reveal = useRef(new Animated.Value(0)).current;
  const sticker = earnedStickerId ? STICKERS.find((s: any) => s.id === earnedStickerId) : null;
  const StickerArt = sticker?.Draw;

  useEffect(() => {
    Animated.spring(reveal, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 14 }).start();
  }, [reveal]);

  const stickerStyle = {
    transform: [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
      { rotate: reveal.interpolate({ inputRange: [0, 1], outputRange: ['-140deg', '0deg'] }) },
    ],
  };

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        {sticker && StickerArt ? (
          <Animated.View style={stickerStyle}>
            <StickerArt size={150} />
          </Animated.View>
        ) : (
          <Slime hat={profile.hat} color={profile.color} mood={passed ? 'happy' : 'calm'} size={110} />
        )}

        <Text style={styles.title}>{passed ? '참 잘했어요!' : '조금만 더 연습해봐요'}</Text>
        <Text style={styles.score}>
          {totalCount}문제 중 {correctCount}개를 한 번에 맞혔어요
          {sticker ? `\n「${sticker.n}」 스티커를 받았어요!` : ''}
        </Text>
        <Text style={styles.progressLine}>
          스티커 {profile.progress.stickers.length} / {STICKERS.length}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Jelly color={C.berry} dark={darken(C.berry)} onPress={onRetry} style={styles.btnWrap} inner={styles.btn}>
          <Text style={styles.btnText}>한 번 더!</Text>
        </Jelly>
        <Jelly color={C.sugar} dark={C.milkDeep} onPress={onStickers} style={styles.btnWrap} inner={styles.btn}>
          <Text style={[styles.btnText, { color: C.ink }]}>스티커 모음 보기</Text>
        </Jelly>
        <Jelly color={C.sugar} dark={C.milkDeep} onPress={onHome} style={styles.btnWrap} inner={styles.btn}>
          <Text style={[styles.btnText, { color: C.ink }]}>홈으로</Text>
        </Jelly>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.round, fontSize: 26, color: C.ink, marginTop: 14 },
  score: { fontFamily: F.hand, fontSize: 18, color: C.inkSoft, marginTop: 8, textAlign: 'center', lineHeight: 26 },
  progressLine: { fontFamily: F.num, fontSize: 15, color: C.inkFaint, marginTop: 10 },

  buttons: { paddingBottom: 24, gap: 12 },
  btnWrap: { width: '100%' },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { fontFamily: F.round, fontSize: 18, color: '#fff' },
});
