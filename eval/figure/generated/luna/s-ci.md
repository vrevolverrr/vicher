A 95% confidence interval is made by a method that captures the true mean in about 95% of repeated samples. The mean is fixed; the intervals change from sample to sample. Here, 19 of the 20 intervals contain the true mean, and the one that misses is marked orange.

```figure
const intervals = [
  [47, 53], [46, 52], [49, 54], [45, 51], [48, 52],
  [47, 55], [46, 50.5], [48, 54], [44, 49], [47.5, 52],
  [46, 53], [48, 51], [45, 54], [47, 50.8], [46, 52],
  [49, 55], [48, 53], [45.5, 51], [47, 54], [46, 51],
];

export default function () {
  return (
    <Figure steps={[{ intervals }]} legend={{
      hit: 'contains true mean',
      miss: 'misses true mean',
      truth: 'true mean',
    }} render={step => (
      <Plot x={[43, 56]} y={[0, 21]} xLabel="Mean" yLabel="Sample">
        {step.intervals.map(([lo, hi], i) => (
          <Segment
            id={`ci${i + 1}`}
            from={[lo, i + 1]}
            to={[hi, i + 1]}
            group={lo <= 50 && 50 <= hi ? 'hit' : 'miss'}
          />
        ))}
        <Segment id="trueMean" from={[50, 0]} to={[50, 21]} group="truth" />
      </Plot>
    )} />
  );
}
```

