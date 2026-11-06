A per-unit tax adds a cost to every unit a seller sells. Sellers need a higher price for the same sale, so the supply curve shifts up by the tax. Buyers pay more, sellers keep less, and some trades stop happening. The lost surplus from those trades is the deadweight loss.

### Tax shifts supply

Sellers keep $P_s$, and buyers pay $P_b$. The tax $t$ is the gap between them:

$$P_b = P_s + t$$

Supply is $P_s = 20 + Q$, so with the tax, supply in buyer prices is $P_b = 20 + t + Q = 40 + Q$.

### Worked example

Without the tax, demand meets supply: $100 - Q = 20 + Q$, so $Q = 40$ and $P = 60$.

With the tax of 20, demand meets the shifted supply: $100 - Q = 40 + Q$, so $2Q = 60$ and $Q = 30$.

- Buyers pay $P_b = 100 - 30 = 70$.
- Sellers keep $P_s = 70 - 20 = 50$. Check: $20 + 30 = 50$.
- Tax revenue is $t \cdot Q = 20 \cdot 30 = 600$.

### Deadweight loss

The 10 lost units form a triangle. Its base is the tax wedge of 20 and its height is the drop in quantity, $40 - 30 = 10$:

$$\text{DWL} = \tfrac{1}{2} \cdot 20 \cdot 10 = 100$$

Check: consumers lose 350 and producers lose 350, so the total loss of 700 equals the revenue of 600 plus the deadweight loss of 100.

```figure
const a = 100, c = 20, t = 20;        // demand intercept, supply intercept, tax per unit
const q0 = (a - c) / 2;               // 40
const p0 = a - q0;                    // 60
const q1 = (a - c - t) / 2;           // 30
const pb = a - q1;                    // 70, buyers pay
const ps = pb - t;                    // 50, sellers keep
const revenue = t * q1;               // 600
const dwl = 0.5 * t * (q0 - q1);      // 100

export default function () {
  const steps = [
    { stage: 0, text: String.raw`No tax. Demand $P = ${a} - Q$ meets supply $P = ${c} + Q$ at $Q = ${q0}$, $P = ${p0}$.` },
    { stage: 1, text: String.raw`The tax adds $${t}$ to seller cost. Supply shifts up to $P = ${c + t} + Q$. The new equilibrium is $Q = ${q1}$.` },
    { stage: 2, text: String.raw`Buyers pay $${pb}$, sellers keep $${ps}$. The lost trades form a triangle with area $\tfrac{1}{2} \cdot ${t} \cdot ${q0 - q1} = ${dwl}$.` },
  ];
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Row gap="lg" align="center">
        <Plot id="market" x={[0, 100]} y={[0, 100]} xLabel="Q" yLabel="P">
          <Fn id="demand" f={x => a - x} from={0} to={100} label="Demand" />
          <Fn id="supply" f={x => c + x} from={0} to={100} label="Supply" state={step.stage ? 'dim' : undefined} />
          <Fn id="supplyTax" f={x => c + t + x} from={0} to={100} label="Supply + tax" state={step.stage ? undefined : 'dim'} />
          <Segment id="wedge" from={[q1, ps]} to={[q1, pb]} label={`tax ${t}`} state={step.stage ? 'active' : 'dim'} />
          <Points id="eq0" pts={[[q0, p0]]} label="no tax" state={step.stage ? 'dim' : 'active'} />
          <Points id="eq1" pts={[[q1, pb], [q1, ps]]} label="with tax" state={step.stage ? 'active' : 'dim'} />
          <Shape id="dwl" pts={[[q1, pb], [q1, ps], [q0, p0]]} closed label="DWL" state={step.stage === 2 ? 'active' : 'dim'} />
        </Plot>
        <Table id="values" title="Values" columns={['', 'No tax', 'With tax']} rows={[
          ['Quantity Q', q0, q1],
          ['Buyer price', p0, pb],
          ['Seller price', p0, ps],
          ['Tax revenue', 0, revenue],
          ['Deadweight loss', 0, dwl],
        ]} />
      </Row>
    )} />
  );
}
```

The triangle is exact here because both curves are straight lines. With curved lines, the same loss needs the area between the curves, found by integration.

Not covered: how the tax burden splits between buyers and sellers in general, and any curved supply or demand.