A **production possibilities frontier (PPF)** shows every mix of two goods that an economy can make with all its resources and technology. **Opportunity cost** is what you give up to get one more unit of a good.

On a bowed PPF, the opportunity cost of a good rises as you make more of it. Resources are not equally good at making both goods. The best land goes to wheat first. Later, poorer land moves to wheat, so each extra tonne of wheat costs more cloth.

The opportunity cost of wheat is the cloth lost per extra tonne of wheat:

$$\text{Opportunity cost of wheat} = \frac{\text{cloth lost}}{\text{wheat gained}}$$

Let $W$ be tonnes of wheat and $C$ be metres of cloth. The frontier is $C = 50 - \frac{W^2}{32}$. Moving from 0 t to 40 t of wheat in 8 t steps:

| Move | Wheat gained (t) | Cloth lost (m) | Opportunity cost (m per t) |
|---|---|---|---|
| A → B | 8 | 2 | 0.25 |
| B → C | 8 | 6 | 0.75 |
| C → D | 8 | 10 | 1.25 |
| D → E | 8 | 14 | 1.75 |
| E → F | 8 | 18 | 2.25 |

```figure
const frontier = x => 50 - x * x / 32;
const xs = [0, 8, 16, 24, 32, 40];
const pts = xs.map(x => [x, frontier(x)]);

export default function () {
  const steps = [];
  for (let i = 0; i < 5; i++) {
    steps.push({ i, from: pts[i], to: pts[i + 1], lost: pts[i][1] - pts[i + 1][1] });
  }
  return (
    <Figure
      steps={steps}
      caption={step => `Move ${step.i + 1}, from ${'ABCDEF'[step.i]} to ${'ABCDEF'[step.i + 1]}: 8 t of wheat costs ${step.lost} m of cloth. Cost per tonne: ${step.lost / 8} m.`}
      render={step => (
        <Plot id="plot" x={[0, 44]} y={[0, 56]} xLabel="Wheat (t)" yLabel="Cloth (m)">
          <Fn id="ppf" f={frontier} from={0} to={40} label="PPF" />
          <Points id="pts" pts={pts} />
          <Segment id="move" from={step.from} to={step.to} label={`${step.lost} m`} state="active" />
        </Plot>
      )}
    />
  );
}
```

Each move gives 8 t of wheat, but costs more cloth than the one before. The slope of the frontier is the opportunity cost, and it gets steeper as wheat rises.

If every tonne cost the same cloth, the PPF would be a straight line and the opportunity cost would stay constant.