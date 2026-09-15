import { forwardRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';

import { Jelly } from '../Jelly';
import { C, darken, F } from '../theme';

export type AnswerFeedback = 'wrong' | null;

interface Props {
  label: string;
  onPress: () => void;
  feedback: AnswerFeedback;
  disabled: boolean;
  colorIndex: number;
}

const PALETTE = [C.berry, C.sky, C.tangerine, C.lime];

// semlime 은 오답을 빨갛게 물들이거나 그 버튼만 흔들지 않는다 — 카드
// 전체가 흔들리고 슬라임 표정만 시무룩해질 뿐, 이미 틀려본 선택지는
// 살짝 옅어지기만 한다(더 못 고르는 이유만 눈에 띄면 충분하다는 원칙).
// ref 를 그대로 Jelly(View)까지 흘려보낸다 — 정답을 맞힌 버튼의 실제
// 화면 좌표를 재야 할 다른 기능에서 재사용할 수 있게.
const AnswerButton = forwardRef<View, Props>(function AnswerButton(
  { label, onPress, feedback, disabled, colorIndex },
  ref
) {
  const color = PALETTE[colorIndex % PALETTE.length];

  return (
    <View style={[styles.wrap, feedback === 'wrong' && styles.tried]}>
      <Jelly ref={ref} color={color} dark={darken(color)} onPress={onPress} disabled={disabled} inner={styles.inner}>
        <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
          {label}
        </Text>
      </Jelly>
    </View>
  );
});

export default AnswerButton;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tried: { opacity: 0.4 },
  inner: { minHeight: 84, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  text: { fontFamily: F.round, fontSize: 22, color: '#fff', textAlign: 'center' },
});
