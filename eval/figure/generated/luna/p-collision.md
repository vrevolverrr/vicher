An **elastic collision** is one where the objects bounce apart while total momentum and kinetic energy stay the same. Here, the 2 kg object moves at 3 m/s and the 1 kg object is at rest.

Momentum before the collision is $2(3)+1(0)=6\ \text{kg·m/s}$, and kinetic energy is $\frac12(2)(3^2)=9\ \text{J}$. Let their final velocities be $v_1$ and $v_2$. For a 1D elastic collision, their separation speed equals their initial approach speed, so $v_2-v_1=3$.

Momentum is conserved:

$$2v_1+v_2=6$$

Substitute $v_2=v_1+3$: $2v_1+(v_1+3)=6$, giving $v_1=1\ \text{m/s}$ and $v_2=4\ \text{m/s}$. The 2 kg object continues forward more slowly; the 1 kg object moves forward at 4 m/s.

```figure
const steps = [
  { first: "3 m/s", second: "0 m/s", text: "Before impact: the 2 kg object approaches the stationary 1 kg object." },
  { first: "1 m/s", second: "4 m/s", text: "After impact: both move forward, and the lighter object moves faster." }
];

export default function () {
  return <Figure steps={steps} caption={step => step.text} render={step => (
    <Table
      id="collision"
      title="Velocity"
      columns={["Object", "Before / after"]}
      rows={[
        ["2 kg", step.first],
        ["1 kg", step.second]
      ]}
    />
  )} />;
}
```

