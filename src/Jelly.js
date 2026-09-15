import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { R } from './theme';

/* 앱의 모든 버튼은 젤리다 — 두께가 있고, 누르면 납작하게 눌렸다 튀어오른다.
   아래쪽 진한 테두리가 두께, 위에 얹힌 그라데이션이 광택이 된다.
   `style` 은 바깥 Pressable(자리 잡기용), `inner` 는 젤리 본체에 붙는다.
   퍼센트 너비는 반드시 바깥에 줘야 한다 — 안쪽에 주면 기준이 없어 찌그러진다.
   forwardRef 로 감싼 건, 정답 표시(동그라미)를 그릴 때 버튼의 실제 화면
   좌표를 measureInWindow 로 재야 하기 때문 — 비율로 대충 추정하면 화면
   크기가 달라질 때마다 위치가 어긋난다. */
export const Jelly = React.forwardRef(function Jelly({
  color, dark, radius = R.lg, lip = 7, style, inner, children,
  onPress, disabled = false, gloss = true, ...rest
}, ref) {
  const a = useRef(new Animated.Value(0)).current;

  const to = (v) =>
    Animated.spring(a, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v ? 0 : 14 }).start();

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, lip - 1] });
  const scaleY = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93] });
  const scaleX = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const elevation = a.interpolate({ inputRange: [0, 1], outputRange: [6, 1] });

  return (
    <Pressable
      style={style}
      onPressIn={() => !disabled && to(1)}
      onPressOut={() => to(0)}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        ref={ref}
        {...(Platform.OS === 'web' ? null : { collapsable: false })}
        style={[
          {
            backgroundColor: color,
            borderRadius: radius,
            borderBottomWidth: lip,
            borderBottomColor: dark,
            overflow: 'hidden',
            elevation,
            shadowColor: '#4A2B45',
            shadowOpacity: 0.22,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            transform: [{ translateY }, { scaleY }, { scaleX }],
          },
          inner,
        ]}
      >
        {gloss ? (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.46)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {children}
      </Animated.View>
    </Pressable>
  );
});
