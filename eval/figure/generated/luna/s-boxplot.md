Using the median-of-halves quartiles, group A’s value 40 is an outlier; the whisker ends at 25.

```figure
export default function () {
  return (
    <Plot id="boxplots" x={[0, 42]} y={[0.4, 3.6]} xLabel="Value" yLabel="Group" equal={false}>
      <Shape pts={[[16, 3.22], [23.5, 3.22], [23.5, 2.78], [16, 2.78]]} closed label="A box" />
      <Segment from={[12, 3]} to={[16, 3]} label="A lower whisker" />
      <Segment from={[23.5, 3]} to={[25, 3]} label="A upper whisker" />
      <Segment from={[12, 2.86]} to={[12, 3.14]} />
      <Segment from={[25, 2.86]} to={[25, 3.14]} />
      <Segment from={[19, 2.78]} to={[19, 3.22]} label="A median" />
      <Points pts={[[40, 3]]} label="A outlier" />
      <Label at={[1, 3]} text="A" />

      <Shape pts={[[10.5, 2.22], [15.5, 2.22], [15.5, 1.78], [10.5, 1.78]]} closed label="B box" />
      <Segment from={[8, 2]} to={[10.5, 2]} label="B lower whisker" />
      <Segment from={[15.5, 2]} to={[18, 2]} label="B upper whisker" />
      <Segment from={[8, 1.86]} to={[8, 2.14]} />
      <Segment from={[18, 1.86]} to={[18, 2.14]} />
      <Segment from={[14.5, 1.78]} to={[14.5, 2.22]} label="B median" />
      <Label at={[1, 2]} text="B" />

      <Shape pts={[[22, 1.22], [28, 1.22], [28, 0.78], [22, 0.78]]} closed label="C box" />
      <Segment from={[20, 1]} to={[22, 1]} label="C lower whisker" />
      <Segment from={[28, 1]} to={[31, 1]} label="C upper whisker" />
      <Segment from={[20, 0.86]} to={[20, 1.14]} />
      <Segment from={[31, 0.86]} to={[31, 1.14]} />
      <Segment from={[25, 0.78]} to={[25, 1.22]} label="C median" />
      <Label at={[1, 1]} text="C" />
    </Plot>
  );
}
```

