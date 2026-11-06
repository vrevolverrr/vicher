A $20 per-unit tax raises the price buyers pay above the price sellers receive by $20. On a supply-and-demand graph, it shifts the supply curve up by $20, from $P=20+Q$ to $P=40+Q$.

Before the tax, set demand equal to supply:

$$
100-Q=20+Q
$$

So $Q=40$ and $P=60$. After the tax, buyers pay $P_b=100-Q$ while sellers receive $P_s=20+Q$. The $20 gap gives:

$$
100-Q=(20+Q)+20
$$

Now $Q=30$: buyers pay $70$, and sellers receive $50$. The tax cuts trade by 10 units. Those lost trades would have created surplus, shown by the shaded triangle:

```figure
export default function () {
  return (
    <Plot id="tax-graph" x={[0, 50]} y={[0, 110]} xLabel="Quantity $Q$" yLabel="Price $P$">
      <Fn id="demand" f={q => 100 - q} from={0} to={50} label="Demand: $100-Q$" />
      <Fn id="supply" f={q => 20 + q} from={0} to={50} label="Supply: $20+Q$" />
      <Fn id="taxed-supply" f={q => 40 + q} from={0} to={50} label="Supply with tax: $40+Q$" />
      <Region id="deadweight-loss" top="demand" base="supply" from={30} to={40} label="Deadweight loss" />
    </Plot>
  );
}
```

The triangle has base 10 units and height $20, so deadweight loss is $\frac12(10)(20)=100$. This is the surplus lost because of trades that no longer happen.

