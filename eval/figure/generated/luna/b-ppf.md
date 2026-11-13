A **production possibilities frontier (PPF)** shows the maximum combinations of two goods an economy can produce with its available resources and technology. When it bows outward, producing more of one good costs increasingly more of the other, because resources are not equally suited to both.

```figure
export default function () {
  return (
    <Plot id="ppf" x={[0, 10]} y={[0, 100]} xLabel="Good X" yLabel="Good Y">
      <Fn id="frontier" f={x => 100 - x * x} from={0} to={10} label="PPF" />
      <Points pts={[[2, 96]]} label="A" />
      <Points pts={[[4, 84]]} label="B" />
      <Points pts={[[6, 64]]} label="C" />
      <Points pts={[[8, 36]]} label="D" />
    </Plot>
  );
}
```

Moving from A to B raises Good X by 2 units and gives up 12 units of Good Y, so the opportunity cost is $12/2 = 6$ units of Y per extra X. From B to C, the same 2 extra X cost 20 Y, or 10 per X. The rising cost as production shifts toward X illustrates increasing opportunity cost. The PPF assumes resources and technology are fixed.

