import { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// @ts-ignore - art.js 는 순수 JS.
import { STICKERS, TIERS } from '../art';
import TopBar from '../components/TopBar';
import { C, F, R, jellyShadow } from '../theme';
import { Profile } from '../types/word';

interface Props {
  profile: Profile;
  onBack: () => void;
}

// 모은 스티커를 톡 누르면 살짝 튀어오른다 — 그냥 나열만 해두면 박제된
// 도감 같아서, 손을 대면 반응하게 해서 진짜 갖고 노는 스티커북처럼 만든다.
function StickerCell({ sticker, have }: { sticker: any; have: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  const Art = sticker.Draw;

  function pop() {
    if (!have) return;
    Haptics.selectionAsync().catch(() => {});
    a.setValue(0);
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 130, useNativeDriver: true }),
      Animated.spring(a, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 16 }),
    ]).start();
  }

  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });

  return (
    <Pressable style={[styles.cell, !have && styles.cellLocked]} onPress={pop}>
      <Animated.View style={[!have && { opacity: 0.14 }, { transform: [{ scale }] }]}>
        <Art size={72} />
      </Animated.View>
      <Text style={[styles.name, !have && { color: C.inkFaint }]}>{have ? sticker.n : '???'}</Text>
    </Pressable>
  );
}

// semlime 의 스티커 모음 화면과 같은 구성 — 실버/골드/전설 등급별로 나눠서
// 보여준다. 모은 건 실물, 못 모은 건 실루엣 + "???" 로 가려서 "다음엔 뭐가
// 나올까" 하는 궁금증을 남긴다.
export default function StickerScreen({ profile, onBack }: Props) {
  const owned = profile.progress.stickers;

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.head}>
        <Text style={styles.h1}>{profile.name}의 스티커</Text>
        <Text style={styles.sub}>
          {owned.length
            ? `${STICKERS.length}장 중 ${owned.length}장 모았어요`
            : '아직 한 장도 없어요. 테스트를 통과하면 한 장씩 받아요'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {[1, 2, 3].map((tier) => {
          const list = STICKERS.filter((s: any) => s.tier === tier);
          const mine = list.filter((s: any) => owned.includes(s.id)).length;
          return (
            <View key={tier}>
              <View style={styles.tierRow}>
                <Text style={styles.tierName}>{TIERS[tier]}</Text>
                <Text style={styles.tierCount}>
                  {mine} / {list.length}
                </Text>
              </View>
              <View style={styles.grid}>
                {list.map((s: any) => (
                  <StickerCell key={s.id} sticker={s} have={owned.includes(s.id)} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  head: { paddingHorizontal: 20, paddingTop: 4 },
  h1: { fontFamily: F.round, fontSize: 26, color: C.ink, textAlign: 'center', marginTop: 6 },
  sub: { fontFamily: F.hand, fontSize: 16, color: C.inkSoft, textAlign: 'center', marginTop: 4, marginBottom: 6 },

  body: { paddingHorizontal: 20, paddingBottom: 28 },
  tierRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 18, marginBottom: 10 },
  tierName: { fontFamily: F.round, fontSize: 19, color: C.ink },
  tierCount: { fontFamily: F.num, fontSize: 14, color: C.inkFaint },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRadius: R.lg,
    backgroundColor: C.sugar,
    ...jellyShadow,
    shadowOpacity: 0.1,
  },
  cellLocked: { backgroundColor: 'rgba(255,255,255,0.55)', shadowOpacity: 0, elevation: 0 },
  name: { fontFamily: F.hand, fontSize: 14, color: C.inkSoft },
});
