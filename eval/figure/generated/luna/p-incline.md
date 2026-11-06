The block’s weight points straight down, the normal force points perpendicular to the incline, and friction points up the slope, opposing the block’s tendency to slide down. The arrow lengths are illustrative. Change the angle with the slider.

```figure
export const params = {
  angle: { label: 'Incline angle', min: 0, max: 60, step: 1, value: 30, unit: '°' }
};

export default function ({ angle }) {
  const rad = angle * Math.PI / 180;
  const t = [Math.cos(rad), Math.sin(rad)];
  const n = [-Math.sin(rad), Math.cos(rad)];
  const origin = [0.5, 0.4];
  const add = (p, a, k = 1) => [p[0] + a[0] * k, p[1] + a[1] * k];
  const along = (p, d, s) => add(p, d, s);

  const foot = along(origin, t, 2.3);
  const far = along(foot, t, 1.5);
  const baseA = add(foot, n, 0.12);
  const baseB = add(far, n, 0.12);
  const topB = add(baseB, n, 0.9);
  const topA = add(baseA, n, 0.9);
  const center = add(add(baseA, t, 0.75), n, 0.45);

  return (
    <Diagram width={10} height={8}>
      <Segment from={origin} to={along(origin, t, 7.5)} label="Rough incline" />
      <Shape pts={[baseA, baseB, topB, topA]} closed label="Block" />
      <Vector from={center} to= {[center[0], center[1] - 1.8]} label="$mg$" />
      <Vector from={center} to={add(center, n, 1.6)} label="$N$" />
      <Vector from={center} to={add(center, t, 1.3)} label="$f$" />
    </Diagram>
  );
}
```

