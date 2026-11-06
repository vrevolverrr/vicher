Using **relative market share 1** and **growth 10%** as the high/low cutoffs:

- **Stars:** A (1.8, 15%)
- **Question marks:** B (0.4, 18%), F (0.7, 12%)
- **Cash cows:** C (2.5, 3%), E (1.1, 9%)
- **Dogs:** D (0.3, 2%)

```figure
export default function () {
  return (
    <Plot x={[0, 3]} y={[0, 20]} xLabel="Relative market share" yLabel="Market growth (%)">
      <Shape pts={[[1, 0], [1, 20]]} label="Share cutoff: 1" />
      <Shape pts={[[0, 10], [3, 10]]} label="Growth cutoff: 10%" />
      <Points pts={[[1.8, 15]]} label="A" />
      <Points pts={[[0.4, 18]]} label="B" />
      <Points pts={[[2.5, 3]]} label="C" />
      <Points pts={[[0.3, 2]]} label="D" />
      <Points pts={[[1.1, 9]]} label="E" />
      <Points pts={[[0.7, 12]]} label="F" />
      <Label at={[2.1, 18]} text="Stars" />
      <Label at={[0.15, 19]} text="Question marks" />
      <Label at={[2.1, 1]} text="Cash cows" />
      <Label at={[0.15, 1]} text="Dogs" />
    </Plot>
  );
}
```

