import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Crown } from '../art';

interface Props {
  from: { x: number; y: number };
  to: { x: number; y: number };
  onArrive: () => void;
}

const SIZE = 40;

// 정답 카드 한가운데서 왕관이 튀어올라 상단 왕관 카운터로 날아가는
// semlime 식 연출 — 포물선처럼 살짝 솟았다가 내려앉듯 중간 지점의 y 를
// 위로 당겨 곡선을 흉내 낸다. 도착하면 onArrive 로 실제 카운트를 올린다.
export default function CrownFlyer({ from, to, onArrive }: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 620,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && onArrive());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arcLift = Math.min(from.y, to.y) - 70;
  const x = t.interpolate({ inputRange: [0, 1], outputRange: [from.x - SIZE / 2, to.x - SIZE / 2] });
  const y = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [from.y - SIZE / 2, arcLift - SIZE / 2, to.y - SIZE / 2],
  });
  const scale = t.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0.3, 1.15, 0.9, 0.45] });
  const opacity = t.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0.5] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, transform: [{ translateX: x }, { translateY: y }, { scale }] }]}
    >
      <Crown size={SIZE} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, zIndex: 20 },
});
