Gravity points down, the normal force is perpendicular to the incline, and friction points up the incline when the block tends to slide down. The force lengths are schematic.

```figure
export const params = {
  angle: { label: 'Incline angle', min: 10, max: 60, step: 1, value: 30, unit: '°' }
};

export default function ({ angle }) {
  const radians = angle * Math.PI / 180;
  const u = [Math.cos(radians), Math.sin(radians)];
  const n = [-Math.sin(radians), Math.cos(radians)];
  const base = [0.7, 0.7];
  const contact = [base[0] + 2.5 * u[0], base[1] + 2.5 * u[1]];
  const center = [contact[0] + 0.4 * n[0], contact[1] + 0.4 * n[1]];
  const point = (a, b, c) => [a[0] + b * c[0], a[1] + b * c[1]];
  const block = [
    point(contact, -0.55, u),
    point(contact, 0.55, u),
    point(point(contact, 0.55, u), 0.8, n),
    point(point(contact, -0.55, u), 0.8, n)
  ];

  return (
    <Diagram width={8} height={7.5}>
      <Segment from={base} to={[base[0] + 5.5 * u[0], base[1] + 5.5 * u[1]]} label="incline" group="surface" />
      <Shape pts={block} closed label="block" group="block" />
      <Vector from={center} to={[center[0], center[1] - 1.6]} label="$mg$" group="gravity" />
      <Vector from={center} to:={[center[0] + 1.4 * n[0], center[1] + 1.4 * n[1]]} label="$N$" group="normal" />
      <Vector from={center} to={[center[0] - 1.2 * u[0], center[1] - 1.2 * u[1]]} label="$f$" group="friction" />
      <Angle at={base} from={[base[0] + 1, base[1]]} to={[base[0] + u[0], base[1] + u[1]]} label={`${angle}°`} />
    </Diagram>
  );
}
```

