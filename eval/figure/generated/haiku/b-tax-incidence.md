A 20 per-unit tax makes buyers pay 70, lets sellers keep 50, and cuts trade from 40 to 30 units. The tax shifts the supply curve up by 20. The trades that no longer happen cost surplus that nobody receives. That lost surplus is the **deadweight loss (DWL)**.

**The tax wedge**

A **per-unit tax** $t$ is a fixed amount collected on each unit sold. It splits the price into two parts: the price buyers pay, $P_b$, and the price sellers keep, $P_s$. Their gap is the tax:

$$P_b - P_s = t$$

**Supply shifts up**

Supply says sellers accept $P_s = 20 + Q$. Buyers now face $P_b = P_s + 20 = 40 + Q$. Demand is unchanged at $P_b = 100 - Q$.

**Worked example**

Find the new quantity where buyer demand meets the taxed supply:

$$100 - Q = 40 + Q \quad\Rightarrow\quad Q = 30$$

Then $P_b = 100 - 30 = 70$ and $P_s = 70 - 20 = 50$. Check: $20 + 30 = 50$, which matches supply.

Before the tax, $100 - Q = 20 + Q$ gives $Q = 40$ and $P = 60$. Surplus for each case:

| | No tax | With tax 20 |
|---|---|---|
| Quantity $Q$ | 40 | 30 |
| Buyer price $P_b$ | 60 | 70 |
| Seller price $P_s$ | 60 | 50 |
| Consumer surplus | 800 | 450 |
| Producer surplus | 800 | 450 |
| Tax revenue | 0 | 600 |
| Total | 1600 | 1500 |

The loss is $1600 - 1500 = 100$. The same result comes from the triangle formula:

$$DWL = \tfrac{1}{2}\, t\, (Q_0 - Q_1) = \tfrac{1}{2}(20)(40 - 30) = 100$$

The figure shows this triangle. Its corners are $(30, 50)$, $(30, 70)$ and $(40, 60)$. Its base is the tax wedge of 20, and its height is the 10 units of trade lost.

```figure
export default function () {
  return (
    <Figure steps={[1]} title="Per-unit tax of 20: supply shifts up by 20" render={() => (
      <Plot x={[0, 100]} y={[0, 110]} xLabel="Q" yLabel="P">
        <Fn f={q => 100 - q} from={0} to={100} label="Demand" />
        <Fn f={q => 20 + q} from={0} to={90} label="Supply before tax" />
        <Fn f={q => 40 + q} from={0} to={60} label="Supply with tax (buyer price)" />
        <Shape pts={[[30, 70], [40, 60], [30, 50]]} closed group="Deadweight loss" />
        <Segment from={[30, 50]} to={[30, 70]} group="Tax wedge" label="t = 20" />
        <Points pts={[[40, 60], [30, 70], [30, 50]]} />
        <Label at={[41, 63]} text="$E_0 = (40, 60)$" />
        <Label at={[31, 73]} text="$P_b = 70$" />
        <Label at={[31, 46]} text="$P_s = 50$" />
      </Plot>
    )} />
  );
}
```

This triangle formula holds for straight-line curves. With perfectly inelastic demand, $Q$ does not fall, so the loss is zero.

Not checked: I did not render the figure here. Skipped: elasticities and a tax levied on buyers, which gives the same equilibrium.