An elastic collision conserves both total momentum and kinetic energy. For the 2 kg mass and 1 kg mass, those conditions determine their final velocities.

Let $v_1$ and $v_2$ be their velocities after impact. Momentum conservation gives:

$$2(3)+1(0)=2v_1+v_2$$

Kinetic energy conservation gives:

$$\frac12(2)(3^2)=\frac12(2)v_1^2+\frac12(1)v_2^2$$

So $v_2=6-2v_1$. Substituting into the energy equation gives $v_1=1$ or $3$. The $3$ m/s solution is the unchanged, no-impact case, so after the collision $v_1=1$ m/s and $v_2=4$ m/s. The first mass continues forward more slowly, and the second moves forward.

```figure
export default function () {
  const steps = [
    { active: 'before', text: 'Before impact: the 2 kg mass moves at 3 m/s; the 1 kg mass is at rest.' },
    { active: 'collision', text: 'During impact, momentum and kinetic energy are conserved.' },
    { active: 'after', text: 'After impact: the masses move at 1 m/s and 4 m/s.' }
  ];
  return <Figure steps={steps} caption={step => step.text} render={step => (
    <Graph
      nodes={[
        { id: 'before', label: 'Before', sub: '2 kg: 3 m/s · 1 kg: 0 m/s' },
        { id: 'collision', label: 'Elastic impact', sub: 'momentum + kinetic energy conserved' },
        { id: 'after', label: 'After', sub: '2 kg: 1 m/s · 1 kg: 4 m/s' }
      ]}
      edges={[
        { id: 'e1', from: 'before', to: 'collision', directed: true },
        { id: 'e2', from: 'collision', to: 'after', directed: true }
      ]}
      states={{ [step.active]: 'active' }}
    />
  )} />;
}
```

