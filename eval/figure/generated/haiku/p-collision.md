An elastic collision is one where the objects bounce apart and no kinetic energy turns into heat, sound, or permanent deformation. Momentum is conserved in every collision. An elastic collision also keeps the kinetic energy the same.

For two objects on one line with no outside forces, both totals stay fixed:

$$m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2$$

$$\tfrac12 m_1u_1^2 + \tfrac12 m_2u_2^2 = \tfrac12 m_1v_1^2 + \tfrac12 m_2v_2^2$$

Here $m$ is mass in kg, $u$ is velocity before, and $v$ is velocity after, in m/s. Momentum is in kg·m/s and kinetic energy is in J.

**Worked example:** $m_1 = 2$ kg, $u_1 = 3$ m/s, $m_2 = 1$ kg, $u_2 = 0$.

1. Momentum before: $2 \times 3 + 1 \times 0 = 6$ kg·m/s.
2. Energy before: $\tfrac12 \cdot 2 \cdot 3^2 = 9$ J.
3. Momentum after: $2v_1 + v_2 = 6$, so $v_2 = 6 - 2v_1$.
4. Energy after: substitute $v_2$ into $v_1^2 + \tfrac12 v_2^2 = 9$:

$$\begin{aligned} v_1^2 + \tfrac12(6-2v_1)^2 &= 9 \\ 3v_1^2 - 12v_1 + 9 &= 0 \\ (v_1-1)(v_1-3) &= 0 \end{aligned}$$

5. The roots are $v_1 = 1$ and $v_1 = 3$. $v_1 = 3$ means A never slowed, so no collision happened. Take $v_1 = 1$ m/s, then $v_2 = 6 - 2(1) = 4$ m/s.
6. Check: momentum $2(1) + 1(4) = 6$ kg·m/s. Energy $\tfrac12(2)(1)^2 + \tfrac12(1)(4)^2 = 1 + 8 = 9$ J. Both match the before values.

```figure
const m1 = 2, u1 = 3, m2 = 1, u2 = 0;
const v1 = (m1 - m2) / (m1 + m2) * u1;
const v2 = 2 * m1 / (m1 + m2) * u1;
const r = 0.4;

export default function () {
  const steps = [
    { a: 0, b: 6.4, va: u1, vb: u2, text: `**Before:** A (2 kg) moves at 3 m/s toward B (1 kg), which is at rest.` },
    { a: 5.6 + v1, b: 6.4 + v2, va: v1, vb: v2, text: `**After:** one second after contact, A moves at 1 m/s and B at 4 m/s. Momentum and kinetic energy both stay the same.` },
  ];
  const data = [
    ['Before', u1, u2, m1 * u1 + m2 * u2, 0.5 * m1 * u1 ** 2 + 0.5 * m2 * u2 ** 2],
    ['After', v1, v2, m1 * v1 + m2 * v2, 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2],
  ];
  return (
    <Figure steps={steps} caption={step => step.text} render={(step, i) => (
      <Row gap="lg" align="center">
        <Diagram id="track" width={12} height={2.5}>
          <Segment id="floor" from={[0, 0]} to={[12, 0]} />
          <Circle id="A" at={[step.a, r]} r={r} group="A, 2 kg" />
          <Label id="la" at={[step.a, 2 * r + 0.5]} text={`A: ${step.va} m/s`} />
          <Circle id="B" at={[step.b, r]} r={r} group="B, 1 kg" />
          <Label id="lb" at={[step.b, 2 * r + 0.5]} text={`B: ${step.vb} m/s`} />
        </Diagram>
        <Table id="sums" title="Totals" columns={['State', '$v_A$ (m/s)', '$v_B$ (m/s)', 'Momentum (kg·m/s)', 'Kinetic energy (J)']} rows={data} rowIds={['r0', 'r1']} states={{ [`r${i}`]: 'active' }} />
      </Row>
    )} />
  );
}
```

This model fails when kinetic energy is lost, as in a sticky collision where the objects stay together. That case is inelastic and needs a different rule.