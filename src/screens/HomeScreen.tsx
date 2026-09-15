import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// @ts-ignore - art.js 는 순수 JS.
import { Crown, Pencil, Slime } from '../art';
import { C, F, R, jellyShadow } from '../theme';
import { DIFFICULTIES, Profile } from '../types/word';

interface Props {
  profiles: Profile[];
  onPick: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  canAdd: boolean;
}

// semlime 의 "누구 차례일까?" 화면 그대로 — 프로필마다 진짜 슬라임
// 미리보기 + 난이도/왕관/스티커 요약, 오른쪽 연필로 꾸미기 화면으로.
export default function HomeScreen({ profiles, onPick, onEdit, onAdd, canAdd }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>누구 차례일까?</Text>
        <Text style={styles.sub}>
          {profiles.length ? '오른쪽 연필을 누르면 이름과 슬라임을 바꿀 수 있어요' : '먼저 친구를 한 명 만들어 볼까요?'}
        </Text>

        <View style={{ gap: 14, marginTop: 6 }}>
          {profiles.map((p) => {
            const difficultyLabel = DIFFICULTIES.find((d) => d.id === p.difficulty)?.label ?? '쉬움';
            return (
              <View key={p.id} style={styles.picker}>
                <Pressable style={styles.pickMain} onPress={() => onPick(p.id)}>
                  <Slime hat={p.hat} color={p.color} mood="happy" size={70} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pickName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <View style={styles.pickMeta}>
                      <Text style={styles.metaText}>{difficultyLabel} · </Text>
                      <Crown size={18} />
                      <Text style={styles.metaText}> {p.progress.currentStep} · 스티커 {p.progress.stickers.length}장</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable style={styles.editBtn} onPress={() => onEdit(p.id)}>
                  <Pencil />
                </Pressable>
              </View>
            );
          })}

          {canAdd ? (
            <Pressable style={styles.addCard} onPress={onAdd}>
              <View style={styles.addPlus}>
                <Text style={styles.addPlusText}>+</Text>
              </View>
              <Text style={styles.addText}>새 친구 만들기</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.milk },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  h1: { fontFamily: F.round, fontSize: 28, color: C.ink, textAlign: 'center', marginTop: 6 },
  sub: { fontFamily: F.hand, fontSize: 17, color: C.inkSoft, textAlign: 'center', marginBottom: 14 },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.sugar,
    borderRadius: R.lg,
    overflow: 'hidden',
    ...jellyShadow,
    shadowOpacity: 0.14,
  },
  pickMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  pickName: { fontFamily: F.round, fontSize: 22, color: C.ink },
  pickMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { fontFamily: F.hand, fontSize: 15, color: C.inkSoft },
  editBtn: { width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: C.milk },

  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    borderRadius: R.lg,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 3,
    borderColor: C.milkDeep,
    borderStyle: 'dashed',
  },
  addPlus: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.milkDeep, alignItems: 'center', justifyContent: 'center' },
  addPlusText: { fontFamily: F.numBold, fontSize: 24, color: C.inkSoft, lineHeight: 28 },
  addText: { fontFamily: F.round, fontSize: 19, color: C.inkSoft },
});
