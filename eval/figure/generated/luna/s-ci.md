I’ll show each interval against the same true mean, with misses marked separately.

Each vertical segment is one 95% confidence interval; the horizontal line is the true mean. This illustrative set has 19 intervals that cover it and one that misses.

```figure
const intervals = [
  [46, 54], [47, 53], [48, 55], [45, 52], [49, 54],
  [46, 51], [47, 55], [48, 53], [45, 54], [49, 52],
  [46, 53], [47, 54], [48, 52], [45, 55], [49, 53],
  [51, 56], [46, 52], [47, 53], [48, 54], [45, 51]
];

export default function () {
  return (
    <Figure
      steps={[{ intervals }]}
      caption={() => '19 intervals cover the true mean; 1 misses.'}
      render={step => (
        <Plot x={[0.5, 20.5]} y={[44, 57]} xLabel="Sample" yLabel="Mean">
          <Fn f={x => 50} label="True mean = 50" />
          {step.intervals.map(([lo, hi], i) => (
            <Shape
              id={`ci-${i + 1}`}
              pts={[[i + 1, lo], [i + 1, hi]]}
              group={i === 15 ? 'misses true mean' : 'covers true mean'}
            />
          ))}
        </Plot>
      )}
    />
  );
}
```

