An **elastic collision** is one where the bodies bounce apart and no kinetic energy turns into heat, sound, or permanent deformation. Put simply, the total energy of motion stays the same.

For two bodies moving along one line, with no outside force during the impact, two rules hold:

$$m_A u_A + m_B u_B = m_A v_A + m_B v_B$$

$$\tfrac{1}{2} m_A u_A^2 + \tfrac{1}{2} m_B u_B^2 = \tfrac{1}{2} m_A v_A^2 + \tfrac{1}{2} m_B v_B^2$$

Here $m$ is mass in kg, $u$ is velocity before the impact, and $v$ is velocity after it. The subscripts $A$ and $B$ name the bodies. The first rule is conservation of momentum, and the second is conservation of kinetic energy. Together they give two equations for the two unknown final velocities.

Step through the example, where $A$ (2 kg, 3 m/s) hits $B$ (1 kg, at rest):

```figure
const steps = [
  {
    heading: '1. Before the collision',
    a: '$v_A = 3$ m/s', b: '$v_B = 0$ m/s',
    tex: String.raw`p = 2(3) + 1(0) = 6\ \text{kg m/s}`,
    text: String.raw`Total momentum is $6$ kg m/s. Total kinetic energy is $\frac{1}{2}(2)(3)^2 = 9$ J.`
  },
  {
    heading: '2. Conserve momentum',
    a: '$v_A$ unknown', b: '$v_B$ unknown',
    tex: String.raw`2v_A + v_B = 6`,
    text: String.raw`Momentum after equals momentum before. This gives one equation with two unknowns.`
  },
  {
    heading: '3. Conserve kinetic energy',
    a: '$v_A$ unknown', b: '$v_B$ unknown',
    tex: String.raw`v_A^2 + \frac{1}{2}v_B^2 = 9`,
    text: String.raw`Energy after equals energy before: $\frac{1}{2}(2)v_A^2 + \frac{1}{2}(1)v_B^2 = 9$. This gives the second equation.`
  },
  {
    heading: '4. Solve the pair',
    a: '$v_A = 1$ m/s', b: '$v_B = 4$ m/s',
    tex: String.raw`v_B = 6 - 2v_A \;\Rightarrow\; v_A^2 - 4v_A + 3 = 0 \;\Rightarrow\; v_A = 1 \text{ or } 3`,
    text: String.raw`Substitute $v_B = 6 - 2v_A$ into the energy equation. The root $v_A = 3$ is the original state with no collision, so $v_A = 1$ m/s and $v_B = 6 - 2(1) = 4$ m/s.`
  },
  {
    heading: '5. Check both laws',
    a: '$v_A = 1$ m/s', b: '$v_B = 4$ m/s',
    tex: String.raw`\begin{aligned} p &= 2(1) + 1(4) = 6 \\ K &= \frac{1}{2}(2)(1)^2 + \frac{1}{2}(1)(4)^2 = 9 \end{aligned}`,
    text: String.raw`After: $p = 6$ kg m/s and $K = 9$ J, the same as before. Both laws hold.`
  }
];

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} heading={step => step.heading} render={step => (
      <Column gap="md" align="center">
        <Row gap="lg" align="center">
          <Node id="A" label="A, 2 kg" sub={step.a} group="2 kg block" />
          <Node id="B" label="B, 1 kg" sub={step.b} group="1 kg block" />
        </Row>
        <Tex id="eq" tex={step.tex} />
      </Column>
    )} />
  );
}
```

The result: $A$ continues at 1 m/s and $B$ moves off at 4 m/s.

This method stops working when energy is lost. In a sticky collision, where the bodies join, kinetic energy is not conserved, so you cannot use the second rule.