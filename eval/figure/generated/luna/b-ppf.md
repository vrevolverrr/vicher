A **production possibilities frontier (PPF)** shows the most an economy can produce of two goods with its available resources. Moving along a bowed-out PPF, producing more of one good means giving up some of the other. If the resources best suited to the first good are used up first, each additional amount costs more of the second good.

Here, each move adds 25 units of X. The amount of Y given up rises from 6.25 to 18.75, then 31.25 and 43.75 units.

```figure
export default function () {
  return (
    <Plot x={[0, 100]} y={[0, 100]} xLabel="Good X" yLabel="Good Y">
      <Fn id="frontier" f={x => 100 - x * x / 100} from={0} to={100} label="PPF" />
      <Points pts={[[0, 100], [25, 93.75], [50, 75], [75, 43.75], [100, 0]]} label="Production choices" />
      <Label at={[7, 83]} text="6.25 Y given up" />
      <Label at={[32, 59]} text="18.75 Y given up" />
      <Label at={[57, 30]} text="31.25 Y given up" />
      <Label at={[80, 12]} text="43.75 Y given up" />
    </Plot>
  );
}
```

