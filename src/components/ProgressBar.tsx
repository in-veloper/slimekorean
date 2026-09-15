import { StyleSheet, View } from 'react-native';

import { C } from '../theme';

interface Props {
  current: number;
  total: number;
}

// 알약 모양 칸을 나열해서 채워나간다 — 한 칸이 문제 하나에 대응돼서
// "몇 개 남았는지" 가 직관적으로 보인다. 문구 라벨은 따로 안 붙인다.
export default function ProgressBar({ current, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={styles.seg}>
          {i < current ? <View style={styles.segFill} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  seg: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: C.sugar,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4A2B45',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segFill: { height: '100%', borderRadius: 999, backgroundColor: C.lime },
});
