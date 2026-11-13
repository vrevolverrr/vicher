```figure
export const params = {
  angle: { label: 'Incline angle', min: 10, max: 60, step: 5, value: 30, unit: '°' }
};

export default function ({ angle }) {
  const t = angle * Math.PI / 180;
  const e = [Math.cos(t), Math.sin(t)];
  const n = [-Math.sin(t), Math.cos(t)];
  const center = [4, 3.1];
  const point = (along, normal = 0) => [
    center[0] + along * e[0] + normal * n[0],
    center[1] + along * e[1] + normal * n[1]
  ];
  const planeStart = point(-2.7);
  const planeEnd = point(2.7);
  const block = [point(-0.9), point(0.9), point(0.9, 0.9), point(-0.9, 0.9)];
  const forceStart = point(0, 0.45);
  const forceEnd = (dx, dy) => [forceStart[0] + dx, forceStart[1] + dy];
  const angleVertex = planeStart;

  return (
    <Column gap="sm" align="center">
      <Diagram id="incline" width={8} height={6.2}>
        <Segment from={planeStart} to={planeEnd} label="rough surface" />
        {Array.from({ length: 11 }, (_, i) => {
          const p = point(-2.4 + i * 0.48);
          return <Segment id={`rough-${i}`} from={p} to={[p[0] + 0.12 * n[0], p[1] + 0.12 * n[1]]} />;
        })}
        <Shape id="block" pts={block} closed label="block" />
        <Vector id="weight" from={forceStart} to={forceEnd(0, -1.7)} label="$mg$" />
        <Vector id="normal" from={forceStart} to={forceEnd(1.5 * n[0], 1.5 * n[1])} label="$N$" />
        <Vector id="friction" from={forceStart} to={forceEnd(1.35 * e[0], 1.35 * e[1])} label="$f_s$" />
        <Angle
          id="angle"
          at={angleVertex}
          from={[angleVertex[0] + 0.8, angleVertex[1]]}
          to={[angleVertex[0] + 0.8 * e[0], angleVertex[1] + 0.8 * e[1]]}
          label={`$${angle}°$`}
        />
      </Diagram>
      <Text>Friction points up the incline, assuming the block tends to slide down.</Text>
    </Column>
  );
}
```

