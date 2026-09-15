import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { HAT_IDS, Slime } from '../art';
import { Jelly } from '../Jelly';
import { C, COLORS, darken, F, R } from '../theme';
import { DEFAULT_QUIZ_LENGTH, DIFFICULTIES, Difficulty, QUIZ_LENGTHS } from '../types/word';

interface Props {
  visible: boolean;
  initial?: { name: string; hat: string; color: string; difficulty: Difficulty; quizLength: number };
  isNew: boolean;
  onClose: () => void;
  onSave: (data: { name: string; hat: string; color: string; difficulty: Difficulty; quizLength: number }) => void;
  onReset?: () => void;
  onDelete?: () => void;
}

// semlime 의 "슬라임 꾸미기" 시트 그대로 — 이름 + 모자(슬라임 미리보기) +
// 색 + 난이도를 한 화면에서 고른다. 새 프로필 만들 때도, 기존 프로필을
// 고칠 때도 이 시트 하나만 쓴다.
export default function ProfileModal({ visible, initial, isNew, onClose, onSave, onReset, onDelete }: Props) {
  const [name, setName] = useState('');
  const [hat, setHat] = useState('plain');
  const [color, setColor] = useState('peach');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [quizLength, setQuizLength] = useState<number>(DEFAULT_QUIZ_LENGTH);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setHat(initial?.hat ?? 'plain');
    setColor(initial?.color ?? 'peach');
    setDifficulty(initial?.difficulty ?? 'easy');
    setQuizLength(initial?.quizLength ?? DEFAULT_QUIZ_LENGTH);
  }, [visible, initial]);

  function submit() {
    onSave({ name: name.trim() || '친구', hat, color, difficulty, quizLength });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={submit} />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <Text style={styles.sheetTitle}>{isNew ? '새 친구 만들기' : '슬라임 꾸미기'}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={10}
            placeholder="이름"
            placeholderTextColor={C.inkFaint}
          />

          <Text style={styles.label}>어떤 슬라임으로 할까요?</Text>
          <View style={styles.chips}>
            {HAT_IDS.map((h: string) => (
              <Pressable key={h} onPress={() => setHat(h)} style={[styles.chip, hat === h && styles.chipSel]}>
                <Slime hat={h} color={color} mood="happy" size={44} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>무슨 색이 좋아요?</Text>
          <View style={styles.chips}>
            {COLORS.map((c: { id: string; main: string }) => (
              <Pressable
                key={c.id}
                onPress={() => setColor(c.id)}
                style={[styles.swatch, { backgroundColor: c.main }, color === c.id && styles.swatchSel]}
              />
            ))}
          </View>

          <Text style={styles.label}>문제 난이도</Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => setDifficulty(d.id)}
                style={[styles.lvBtn, difficulty === d.id && styles.lvSel]}
              >
                <Text style={[styles.lvText, difficulty === d.id && { color: C.ink }]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>테스트 문제 수</Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {QUIZ_LENGTHS.map((n) => (
              <Pressable
                key={n}
                onPress={() => setQuizLength(n)}
                style={[styles.lvBtn, quizLength === n && styles.lvSel]}
              >
                <Text style={[styles.lvText, quizLength === n && { color: C.ink }]}>{n}개</Text>
              </Pressable>
            ))}
          </View>

          <Jelly color={C.berry} dark={darken(C.berry)} onPress={submit} style={styles.ctaWrap} inner={styles.cta}>
            <Text style={styles.ctaText}>{isNew ? '만들기!' : '다 됐어요!'}</Text>
          </Jelly>

          {!isNew && onReset && onDelete ? (
            <View style={styles.dangerZone}>
              <DangerButton label="기록 초기화하기" confirmLabel="정말 지울래요" color={C.tangerine} onConfirm={onReset} />
              <DangerButton label="이 친구 삭제하기" confirmLabel="정말 삭제할래요" color="#E4695F" onConfirm={onDelete} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

// 지우는 동작은 두 번 눌러야 실행된다 — 아이가 잘못 눌러 기록이 날아가지 않게.
function DangerButton({
  label,
  confirmLabel,
  color,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  color: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <Pressable style={styles.dangerGhost} onPress={() => setArmed(true)}>
        <Text style={[styles.dangerGhostText, { color }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.dangerRow}>
      <Pressable style={[styles.dangerBtn, { backgroundColor: color }]} onPress={onConfirm}>
        <Text style={styles.dangerBtnText}>{confirmLabel}</Text>
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={() => setArmed(false)}>
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(74,43,69,0.45)' },
  sheet: {
    backgroundColor: C.sugar,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: '86%',
  },
  grab: { width: 46, height: 5, borderRadius: 999, backgroundColor: C.milkDeep, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontFamily: F.round, fontSize: 23, color: C.ink, textAlign: 'center', marginBottom: 12 },
  label: { fontFamily: F.hand, fontSize: 16, color: C.inkSoft, marginTop: 14, marginBottom: 7 },
  input: {
    fontFamily: F.round,
    fontSize: 24,
    color: C.ink,
    backgroundColor: C.milk,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: 52,
    height: 52,
    borderRadius: R.sm,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  chipSel: { borderColor: C.grape, backgroundColor: '#F0EBFF' },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 4, borderColor: 'transparent' },
  swatchSel: { borderColor: C.ink },
  lvBtn: { flex: 1, paddingVertical: 13, borderRadius: R.md, backgroundColor: C.milk, alignItems: 'center', borderWidth: 3, borderColor: 'transparent' },
  lvSel: { backgroundColor: '#F0EBFF', borderColor: C.grape },
  lvText: { fontFamily: F.round, fontSize: 17, color: C.inkSoft },

  ctaWrap: { width: '100%', marginTop: 20 },
  cta: { paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: F.round, fontSize: 22, color: '#fff' },

  dangerZone: { marginTop: 22, marginBottom: 8, gap: 8, borderTopWidth: 2, borderTopColor: C.milk, paddingTop: 16 },
  dangerGhost: { paddingVertical: 12, borderRadius: R.md, backgroundColor: C.milk, alignItems: 'center' },
  dangerGhostText: { fontFamily: F.round, fontSize: 16 },
  dangerRow: { flexDirection: 'row', gap: 8 },
  dangerBtn: { flex: 2, paddingVertical: 12, borderRadius: R.md, alignItems: 'center' },
  dangerBtnText: { fontFamily: F.round, fontSize: 16, color: '#fff' },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: R.md, backgroundColor: C.milk, alignItems: 'center' },
  cancelText: { fontFamily: F.round, fontSize: 16, color: C.inkSoft },
});
