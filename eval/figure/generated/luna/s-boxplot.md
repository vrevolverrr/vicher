Using median-of-halves quartiles and Tukey whiskers, A’s value 40 is an outlier; the whisker ends at 25.

```figure
export default function () {
  return (
    <Diagram width={42} height={4}>
      <Segment id="a-whisker" from={[12, 3]} to={[25, 3]} group="A" />
      <Segment id="a-low-cap" from={[12, 2.8]} to={[12, 3.2]} group="A" />
      <Segment id="a-high-cap" from={[25, 2.8]} to={[25, 3.2]} group="A" />
      <Shape id="a-box" pts={[[16, 2.7], [23.5, 2.7], [23.5, 3.3], [16, 3.3]]} closed group="A" />
      <Segment id="a-median" from={[19, 2.7]} to={[19, 3.3]} group="A" />
      <Points id="a-outlier" pts={[[40, 3]]} label="40" group="A" />

      <Segment id="b-whisker" from={[8, 2]} to={[18, 2]} group="B" />
      <Segment id="b-low-cap" from={[8, 1.8]} to={[8, 2.2]} group="B" />
      <Segment id="b-high-cap" from={[18, 1.8]} to={[18, 2.2]} group="B" />
      <Shape id="b-box" pts={[[10.5, 1.7], [15.5, 1.7], [15.5, 2.3], [10.5, 2.3]]} closed group="B" />
      <Segment id="b-median" from={[14.5, 1.7]} to={[14.5, 2.3]} group="B" />

      <Segment id="c-whisker" from={[20, 1]} to={[31, 1]} group="C" />
      <Segment id="c-low-cap" from={[20, 0.8]} to={[20, 1.2]} group="C" />
      <Segment id="c-high-cap" from={[31, 0.8]} to={[31, 1.2]} group="C" />
      <Shape id="c-box" pts={[[22, 0.7], [28, 0.7], [28, 1.3], [22, 1.3]]} closed group="C" />
      <Segment id="c-median" from={[25, 0.7]} to={[25, 1.3]} group="C" />

      <Segment id="axis" from={[0, 0.3]} to={[42, 0.3]} />
      {[0, 10, 20, 30, 40].map(x => (
        <>
          <Segment id={`tick-${x}`} from={[x, 0.2]} to={[x, 0.4]} />
          <Label id={`tick-label-${x}`} at={[x, 0]} text={x} />
        </>
      ))}
      <Label id="label-a" at={[1, 3]} text="A" />
      <Label id="label-b" at={[1, 2]} text="B" />
      <Label id="label-c" at={[1, 1]} text="C" />
    </Diagram>
  );
}
```

A: Q1 16, median 19, Q3 23.5; B: 10.5, 14.5, 15.5; C: 22, 25, 28.

