import { StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  /** 青・ラベンダー・ピンク（不透明度込み） */
  colors: readonly [string, string, string];
};

const BLOBS = [
  { id: 'hb0', cx: 250, cy: 90, rx: 210, ry: 150 },
  { id: 'hb1', cx: 340, cy: 210, rx: 170, ry: 170 },
  { id: 'hb2', cx: 380, cy: 330, rx: 150, ry: 130 },
] as const;

/** ホーム上部の右側に敷く、ぼかした色の塊（カンプの波形のにじみ）。文字の下に置く装飾 */
export function HeroBlobs({ colors }: Props) {
  return (
    <Svg
      pointerEvents="none"
      style={styles.root}
      viewBox="0 0 400 480"
      preserveAspectRatio="xMidYMin slice">
      <Defs>
        {BLOBS.map((b, i) => (
          <RadialGradient key={b.id} id={b.id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors[i]} />
            <Stop offset="1" stopColor={colors[i]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {BLOBS.map((b) => (
        <Ellipse key={b.id} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#${b.id})`} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, height: 480 },
});
