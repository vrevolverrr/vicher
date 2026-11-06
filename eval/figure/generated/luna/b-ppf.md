A **production possibilities frontier (PPF)** shows the maximum combinations of two goods an economy can make with its available resources and technology. When the frontier bends outward, producing more of one good means giving up increasingly more of the other.

For example, moving along the frontier from A to B to C to D, production of Good X rises by 2 units each time. Good Y falls by 1, then 3, then 5 units, so the opportunity cost of producing more X increases.

```figure
export default function () {
  return (
    <Plot id="frontier" x={[0, 6]} y={[0, 10]} xLabel="Good X" yLabel="Good Y">
      <Fn id="ppf" f={x => 10 - 0.25 * x * x} from={0} to={6} label="PPF" />
      <Points id="a" pts={[[0, 10]]} />
      <Points id="b" pts={[[2, 9]]} />
      <Points id="c" pts={[[4, 6]]} />
      <Points id="d" pts={[[6, 1]]} />
      <Label at={[0, 10]} text="A" />
      <Label at={[2, 9]} text="B" />
      <Label at={[4, 6]} text="C" />
      <Label at={[6, 1]} text="D" />
    </Plot>
  );
}
```

  
