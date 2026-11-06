A production possibilities frontier (PPF) is the curve of the most output of two goods an economy can make with its workers, machines and technology. Points on the curve use all resources. Points inside it waste resources. Points outside it cannot be reached yet.

Opportunity cost is what you give up of one good to get one more unit of the other. On the frontier, it is the slope of the curve, read as a positive number:

$$\text{Opportunity cost of one more } X = -\frac{\Delta Y}{\Delta X}$$

This frontier is a model: $Y = 12 - 0.75X^2$ for $0 \le X \le 4$, where $X$ is food and $Y$ is cloth. Step through the trades:

```figure
const frontier = x => 12 - 0.75 * x * x;   // cloth Y for food X

export default function () {
  const steps = [
    { a: 0, b: 0, row: null, text: 'Start at $X=0$, $Y=12$. Only cloth is made.' },
    { a: 0, b: 2, row: 'r1', text: 'Trade in 2 food: cloth falls from $12$ to $9$. Each food costs $3/2 = 1.5$ cloth.' },
    { a: 2, b: 4, row: 'r2', text: 'Trade in the next 2 food: cloth falls from $9$ to $0$. Each food costs $9/2 = 4.5$ cloth.' },
  ];
  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Row gap="lg" align="center">
          <Plot id="ppf" x={[0, 5]} y={[0, 13]} xLabel="Food (X)" yLabel="Cloth (Y)">
            <Fn id="curve" f={frontier} from={0} to={4} label="Frontier" />
            <Segment id="trade" from={[step.a, frontier(step.a)]} to={[step.b, frontier(step.b)]} />
            <Points id="pa" pts={[[step.a, frontier(step.a)]]} />
            <Points id="pb" pts={[[step.b, frontier(step.b)]]} />
          </Plot>
          <Table
            id="tbl"
            columns={["Trade", "Cloth lost", "Cloth per food"]}
            rows={[["X: 0 to 2", "3", "1.5"], ["X: 2 to 4", "9", "4.5"]]}
            rowIds={["r1", "r2"]}
            states={step.row ? { [step.row]: "active" } : {}}
          />
        </Row>
      )}
    />
  );
}
```

The curve bows outward, so opportunity cost rises. The cost per food goes from 1.5 cloth to 4.5 cloth. The first food uses the land and workers best suited to farming. Later food must draw on resources better suited to cloth, so each extra unit costs more cloth.

This holds while resources and technology stay fixed. Better technology shifts the whole frontier outward.