import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const APath = Animated.createAnimatedComponent(Path);

// 정답 버튼 위에 실제로 빨간펜으로 동그라미 친 것처럼 손글씨 느낌 원을
// 그린다(semlime 의 Fx.js 발상 그대로). 예전엔 4지선다 그리드가 "항상
// 같은 자리"라고 가정하고 화면 비율로 좌표를 추정했는데, 실제 렌더링
// 위치와 어긋나 좌상단 근처에 엉뚱하게 뜨는 문제가 있었다 — 지금은 호출하는
// 쪽(QuizScreen)이 버튼을 measureInWindow 로 실측해서 넘겨주는 좌표만 쓴다.
// "정답이에요!" 같은 문구도 넣지 않는다 — 동그라미와 (호출하는 쪽에서
// 올리는) 왕관 카운트만으로 충분하다는 게 이 앱의 원칙이다.
const CIRCLE_D =
  'M54 9 C27 8 9 28 9 51 C9 76 29 93 53 93 C79 93 93 73 93 49 ' +
  'C93 27 78 10 55 8 C49 8 45 9 41 11';
const LEN = 300;

interface Props {
  x: number;
  y: number;
  size?: number;
}

export default function CircleMark({ x, y, size = 130 }: Props) {
  const draw = useRef(new Animated.Value(0)).current;
  const show = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    draw.setValue(0);
    show.setValue(0);
    Animated.timing(draw, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.22, 0.75, 0.3, 1),
      useNativeDriver: false,
    }).start();
    Animated.timing(show, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [x, y, draw, show]);

  const strokeDashoffset = draw.interpolate({ inputRange: [0, 1], outputRange: [LEN, 0] });
  const scale = show.interpolate({ inputRange: [0, 0.42, 0.78, 1], outputRange: [0.82, 1, 1.04, 1.16] });
  const rotate = show.interpolate({ inputRange: [0, 0.42, 1], outputRange: ['-5deg', '-3deg', '0deg'] });
  const opacity = show.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1, 1, 0] });
  const bloomOpacity = show.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 0.3, 0] });
  const bloomScale = show.interpolate({ inputRange: [0, 1], outputRange: [0.35, 2.2] });
  const bloomSize = size * 1.5;

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - bloomSize / 2,
          top: y - bloomSize / 2,
          width: bloomSize,
          height: bloomSize,
          borderRadius: bloomSize / 2,
          backgroundColor: '#FFD6DE',
          opacity: bloomOpacity,
          transform: [{ scale: bloomScale }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity,
          transform: [{ rotate }, { scale }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <APath
            d={CIRCLE_D}
            fill="none"
            stroke="#FF4D6D"
            strokeWidth={8.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={LEN}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
      </Animated.View>
    </>
  );
}
