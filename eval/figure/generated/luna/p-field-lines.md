I’ll show the field lines as a dipole: arrows leave the positive charge and enter the negative charge.

Electric field lines show the direction a positive test charge would move. For two equal, opposite point charges, the lines leave the positive charge and end at the negative charge; the pattern is symmetric.

```figure
export default function () {
  const paths = [0, 0.55, 1.1, 1.65].flatMap((h, i) => [
    { id: `up${i}`, h },
    { id: `down${i}`, h: -h }
  ]);
  const point = (t, h) => {
    const u = 1 - t;
    return [
      u * u * u * -1.1 + 3 * u * u * t * -0.7 + 3 * u * t * t * 0.7 + t * t * t * 1.1,
      3 * u * u * t * h + 3 * u * t * t * h
    ];
  };
  const points = (h) => Array.from({ length: 41 }, (_, i) => point(i / 40, h));
  return (
    <Diagram width={6.5} height={4.5}>
      {paths.map(({ id, h }) => {
        const p = point(0.58, h);
        const q = point(0.68, h);
        return <>
          <Shape id={id} pts={points(h)} />
          <Vector id={`arrow${id}`} from={p} to={q} />
        </>;
      })}
      <Circle id="positive" at={[-1.1, 0]} r={0.18} label="+" />
      <Circle id="negative" at={[1.1, 0]} r={0.18} label="−" />
    </Diagram>
  );
}
```

