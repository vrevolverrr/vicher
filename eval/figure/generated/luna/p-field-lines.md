The arrows show the field’s direction: away from the positive charge and toward the negative charge.

```figure
export default function () {
  const heights = [-1.6, -0.9, -0.35, 0, 0.35, 0.9, 1.6];
  const curve = (h, t) => {
    const u = 1 - t;
    return [-u + t, 2 * u * t * h];
  };
  return (
    <Diagram width={5} height={4}>
      {heights.map((h, i) => {
        const pts = Array.from({ length: 41 }, (_, j) => curve(h, j / 40));
        const from = curve(h, 0.52);
        const to = curve(h, 0.58);
        return (
          <>
            <Shape id={`line${i}`} pts={pts} />
            <Vector id={`arrow${i}`} from={from} to={to} />
          </>
        );
      })}
      <Circle id="positive" at={[-1, 0]} r={0.13} label="+" />
      <Circle id="negative" at={[1, 0]} r={0.13} label="−" />
    </Diagram>
  );
}
```

These curves are illustrative; a real point charge has infinitely many field lines.

