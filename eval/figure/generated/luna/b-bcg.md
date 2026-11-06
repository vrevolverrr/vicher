Using **relative market share = 1** and **growth = 10%** as the high/low cutoffs:

- **Stars:** A (1.8, 15%)
- **Question marks:** B (0.4, 18%), F (0.7, 12%)
- **Cash cows:** C (2.5, 3%), E (1.1, 9%)
- **Dogs:** D (0.3, 2%)

```figure
export default function () {
  return (
    <Plot id="bcg" x={[0, 3]} y={[0, 20]} xLabel="Relative market share" yLabel="Market growth (%)">
      <Shape id="share-cutoff" pts={[[1, 0], [1, 20]]} />
      <Shape id="growth-cutoff" pts={[[0, 10], [3, 10]]} />
      <Label at={[2, 18]} text="Stars" />
      <Label at={[0.35, 15]} text="Question marks" />
      <Label at={[2, 7]} text="Cash cows" />
      <Label at={[0.35, 5]} text="Dogs" />
      <Points pts={[[1.8, 15], [0.4, 18], [2.5, 3], [0.3, 2], [1.1, 9], [0.7, 12]]} />
      <Label at={[1.8, 15]} text="A" />
      <Label at={[0.4, 18]} text="B" />
      <Label at={[2.5, 3]} text="C" />
      <Label at={[0.3, 2]} text="D" />
      <Label at={[1.1, 9]} text="E" />
      <Label at={[0.7, 12]} text="F" />
    </Plot>
  );
}
```

