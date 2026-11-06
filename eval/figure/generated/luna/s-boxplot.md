Using the median-of-halves method, A’s value 40 is an outlier, so its upper whisker ends at 25.

```figure
export default function () {
  return (
    <Plot x={[5, 42]} y={[0.5, 3.5]} xLabel="Value" yLabel="Group">
      <Segment id="A-whisker" from={[12, 3]} to={[25, 3]} />
      <Segment id="A-low-cap" from={[12, 2.8]} to={[12, 3.2]} />
      <Segment id="A-high-cap" from={[25, 2.8]} to={[25, 3.2]} />
      <Shape id="A-box" pts={[[16, 2.75], [23.5, 2.75], [23.5, 3.25], [16, 3.25]]} closed />
      <Segment id="A-median" from={[19, 2.75]} to={[19, 3.25]} />
      <Points id="A-outlier" pts={[[40, 3]]} />
      <Label id="A-label" at={[6, 3]} text="A" />

      <Segment id="B-whisker" from={[8, 2]} to={[18, 2]} />
      <Segment id="B-low-cap" from={[8, 1.8]} to={[8, 2.2]} />
      <Segment id="B-high-cap" from={[18, 1.8]} to={[18, 2.2]} />
      <Shape id="B-box" pts={[[10.5, 1.75], [15.5, 1.75], [15.5, 2.25], [10.5, 2.25]]} closed />
      <Segment id="B-median" from={[14.5, 1.75]} to={[14.5, 2.25]} />
      <Label id="B-label" at={[6, 2]} text="B" />

      <Segment id="C-whisker" from={[20, 1]} to={[31, 1]} />
      <Segment id="C-low-cap" from={[20, 0.8]} to={[20, 1.2]} />
      <Segment id="C-high-cap" from={[31, 0.8]} to={[31, 1.2]} />
      <Shape id="C-box" pts={[[22, 0.75], [28, 0.75], [28, 1.25], [22, 1.25]]} closed />
      <Segment id="C-median" from={[25, 0.75]} to={[25, 1.25]} />
      <Label id="C-label" at={[6, 1]} text="C" />
    </Plot>
  );
}
```

