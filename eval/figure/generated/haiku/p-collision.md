An elastic collision conserves both momentum and kinetic energy, which gives $v_1 = 1$ m/s and $v_2 = 4$ m/s.

```figure
const m1 = 2, u1 = 3, m2 = 1, u2 = 0;
const v1 = (m1 - m2) / (m1 + m2) * u1;
const v2 = 2 * m1 / (m1 + m2) * u1;
const p0 = m1 * u1 + m2 * u2;
const p1 = m1 * v1 + m2 * v2;
const k0 = 0.5 * m1 * u1 ** 2;
const k1 = 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2;

const steps = [
  { ax: 1, bx: 6, va: u1, vb: u2, cells: ['?', '?', '?', '?'], hot: null,
    text: String.raw`**Before.** Ball A (2 kg) moves right at $u_1 = 3$ m/s. Ball B (1 kg) is at rest, $u_2 = 0$.` },
  { ax: 4.8, bx: 6, va: u1, vb: u2, cells: ['?', '?', '?', '?'], hot: null,
    text: String.raw`**Contact.** No outside force acts during the impact, so total momentum stays fixed: $p = m_1u_1 + m_2u_2 = 2(3) + 1(0) = 6$ kg m/s.` },
  { ax: 4.8, bx: 6, va: null, vb: null, cells: [v1, '?', '?', '?'], hot: 'ra.2',
    text: String.raw`**Ball A after.** An elastic collision also keeps kinetic energy. Solving both conservation equations gives $v_1 = \frac{m_1 - m_2}{m_1 + m_2}\,u_1 = \frac{2-1}{2+1}(3) = 1$ m/s.` },
  { ax: 4.8, bx: 6, va: null, vb: null, cells: [v1, v2, '?', '?'], hot: 'rb.2',
    text: String.raw`**Ball B after.** $v_2 = \frac{2m_1}{m_1 + m_2}\,u_1 = \frac{4}{3}(3) = 4$ m/s.` },
  { ax: 4.8, bx: 6, va: null, vb: null, cells: [v1, v2, p1, '?'], hot: 'rp.2',
    text: String.raw`**Check momentum.** $p = m_1v_1 + m_2v_2 = 2(1) + 1(4) = 6$ kg m/s. This equals the 6 kg m/s before the collision.` },
  { ax: 4.8, bx: 6, va: null, vb: null, cells: [v1, v2, p1, k1], hot: 'rk.2',
    text: String.raw`**Check kinetic energy.** Before: $\frac{1}{2}(2)(3)^2 = 9$ J. After: $\frac{1}{2}(2)(1)^2 + \frac{1}{2}(1)(4)^2 = 1 + 8 = 9$ J. Energy is conserved, so the collision is elastic.` },
  { ax: 5.8, bx: 10, va: v1, vb: v2, cells: [v1, v2, p1, k1], hot: null,
    text: String.raw`**After.** Ball B moves faster and ahead of Ball A, so the balls do not collide again.` },
];

export default function () {
  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Column gap="md">
          <Diagram id="track" width={12} height={3}>
            <Segment from={[0, 0.4]} to={[12, 0.4]} />
            <Circle id="ballA" at={[step.ax, 1]} r={0.6} label="2 kg" group="Ball A" />
            <Circle id="ballB" at={[step.bx, 1]} r={0.6} label="1 kg" group="Ball B" />
            {step.va > 0 && <Vector id="arrA" from={[step.ax - 0.6, 2.2]} to={[step.ax - 0.6 + step.va * 0.5, 2.2]} label={`${step.va} m/s`} group="Ball A" />}
            {step.vb > 0 && <Vector id="arrB" from={[step.bx - 0.6, 2.2]} to={[step.bx - 0.6 + step.vb * 0.5, 2.2]} label={`${step.vb} m/s`} group="Ball B" />}
            {step.vb === 0 && <Label id="restB" at={[step.bx, 2.2]} text="at rest" group="Ball B" />}
          </Diagram>
          <Table
            id="tbl"
            title="Values"
            columns={['Quantity', 'Before', 'After']}
            rows={[
              ['Ball A velocity (m/s)', u1, step.cells[0]],
              ['Ball B velocity (m/s)', u2, step.cells[1]],
              ['Total momentum (kg m/s)', p0, step.cells[2]],
              ['Total kinetic energy (J)', k0, step.cells[3]],
            ]}
            rowIds={['ra', 'rb', 'rp', 'rk']}
            states={step.hot ? { [step.hot]: 'active' } : {}}
          />
        </Column>
      )}
    />
  );
}
```