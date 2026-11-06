An elastic collision conserves both total momentum and total kinetic energy. In one dimension, that means the objects leave with the same relative speed they approached with, but in the opposite direction.

Let the initial velocities be $u_1=3$ m/s and $u_2=0$. After the collision, call the velocities $v_1$ and $v_2$.

1. **Conserve momentum.** The initial momentum is $2(3)+1(0)=6$ kg·m/s, so:

$$2v_1+v_2=6$$

2. **Reverse the relative velocity.** They approach at $3$ m/s, so they separate at $3$ m/s:

$$v_2-v_1=3$$

3. **Solve.** From the second equation, $v_2=v_1+3$. Substituting into the momentum equation gives $2v_1+(v_1+3)=6$, so $v_1=1$ m/s and $v_2=4$ m/s.

The 2 kg object continues forward at **1 m/s**; the 1 kg object moves forward at **4 m/s**.

```figure
const steps = [
  { v1: 3, v2: 0, text: 'Before impact: the 2 kg object moves at $3$ m/s; the 1 kg object is at rest.' },
  { v1: 1, v2: 4, text: 'After impact: the 2 kg object moves at $1$ m/s; the 1 kg object moves at $4$ m/s.' }
];

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} title="Velocities before and after" render={step => (
      <Diagram width={10} height={3}>
        <Circle at={[2, 1.5]} r={0.45} label="2 kg" />
        <Circle at={[6.5, 1.5]} r={0.45} label="1 kg" />
        <Vector from={[2, 1.5]} to={[2 + step.v1 * 0.5, 1.5]} label={`${step.v1} m/s`} />
        <Vector from={[6.5, 1.5]} to={[6.5 + step.v2 * 0.5, 1.5]} label={`${step.v2} m/s`} />
      </Diagram>
    )} />
  );
}
```

