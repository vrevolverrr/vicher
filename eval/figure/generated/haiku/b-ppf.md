A **production possibilities frontier (PPF)** is a curve showing the largest mix of two goods an economy can make, using all its resources and its current technology. Points on the curve are efficient. Points inside it waste resources. Points outside it cannot be reached yet.

**Opportunity cost** is what you give up to get one more unit of a good. On a PPF, it is the amount of one good lost for each unit of the other gained:

$$\text{Opportunity cost of food} = \frac{\text{clothing given up}}{\text{food gained}}$$

Here the frontier is $C = 100 - F^2$, where $F$ is food in tonnes and $C$ is clothing in units. Going from 0 to 1 tonne of food costs 1 unit of clothing. Going from 4 to 5 tonnes costs 9 units. Going from 9 to 10 tonnes costs 19 units.

### Why the cost rises

The resources are not equally good at making both goods. The best land and workers go to food first. Each later tonne needs land that is poor at growing food, so more clothing output must be given up to free it. This is why the frontier bows outward and gets steeper as food rises.

The cost stays constant only if every resource is equally good at both goods. Then the PPF is a straight line.

```figure
const curve = x => 100 - x * x;
const dots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [x, curve(x)]);
const moves = [[0, 1], [4, 5], [9, 10]];

export default function () {
  const steps = moves.map(([a, b]) => ({ a, b }));
  return (
    <Figure
      steps={steps}
      caption={step => `Food rises by ${step.b - step.a} tonne. Clothing falls by ${curve(step.a) - curve(step.b)} units. Opportunity cost: ${curve(step.a) - curve(step.b)} clothing per tonne of food.`}
      render={step => (
        <Plot id="ppf" x={[0, 10]} y={[0, 100]} xLabel="Food (tonnes)" yLabel="Clothing (units)">
          <Fn id="frontier" f={x => curve(x)} label="Frontier" />
          <Points id="dots" pts={dots} />
          <Points id="start" pts={[[step.a, curve(step.a)]]} state="active" />
          <Points id="end" pts={[[step.b, curve(step.b)]]} state="active" />
          <Segment id="gain" from={[step.a, curve(step.a)]} to={[step.b, curve(step.a)]} label={`+${step.b - step.a} food`} />
          <Segment id="lost" from={[step.b, curve(step.a)]} to={[step.b, curve(step.b)]} label={`-${curve(step.a) - curve(step.b)} clothing`} state="active" />
        </Plot>
      )}
    />
  );
}
```