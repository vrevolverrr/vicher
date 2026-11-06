For an ideal mass on an undamped spring, the mass moves back and forth while energy shifts between motion and spring stretch. Here are the position, velocity, kinetic energy, and potential energy over one period.

For a mass $m$ on a spring with stiffness $k$, released from rest at displacement $A$, the motion is:

$$
x(t)=A\cos(\omega t), \qquad \omega=\sqrt{\frac{k}{m}}
$$

Here $x$ is position, $t$ is time, and $\omega$ is angular frequency. Velocity is the rate of change of position; kinetic energy comes from motion, and potential energy is stored in the spring:

$$
v(t)=-A\omega\sin(\omega t), \qquad K(t)=\frac12 mv(t)^2, \qquad U(t)=\frac12 kx(t)^2
$$

Take $m=1\,\text{kg}$, $k=4\,\text{N/m}$, and $A=0.5\,\text{m}$. Then $\omega=2\,\text{rad/s}$ and the period is $T=2\pi/\omega=\pi\,\text{s}$. At $t=T/4$, the mass passes through equilibrium: $x=0$, $v=-1\,\text{m/s}$, $K=0.5\,\text{J}$, and $U=0$. The figure tracks the motion across the full period.

```figure
const m = 1;
const k = 4;
const A = 0.5;
const omega = Math.sqrt(k / m);
const T = 2 * Math.PI / omega;
const xAt = t => A * Math.cos(omega * t);
const vAt = t => -A * omega * Math.sin(omega * t);
const kAt = t => 0.5 * m * vAt(t) ** 2;
const uAt = t => 0.5 * k * xAt(t) ** 2;

export default function () {
  const steps = Array.from({ length: 13 }, (_, i) => {
    const t = T * i / 12;
    return { t, text: `Time $t=${t.toFixed(2)}$ s of $T=${T.toFixed(2)}$ s` };
  });

  return (
    <Figure
      title="One period of spring motion"
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Column gap="sm">
          <Plot id="position" x={[0, T]} y={[-0.6, 0.6]} xLabel="Time $t$ (s)" yLabel="Position $x$ (m)">
            <Fn id="xCurve" f={t => xAt(t)} from={0} to={T} label="Position" />
            <Segment id="xCursor" from={[step.t, -0.6]} to={[step.t, 0.6]} />
            <Points id="xNow" pts={[[step.t, xAt(step.t)]]} />
          </Plot>
          <Plot id="velocity" x={[0, T]} y={[-1.2, 1.2]} xLabel="Time $t$ (s)" yLabel="Velocity $v$ (m/s)">
            <Fn id="vCurve" f={t => vAt(t)} from={0} to={T} label="Velocity" />
            <Segment id="vCursor" from={[step.t, -1.2]} to={[step.t, 1.2]} />
            <Points id="vNow" pts={[[step.t, vAt(step.t)]]} />
          </Plot>
          <Plot id="kinetic" x={[0, T]} y={[0, 0.6]} xLabel="Time $t$ (s)" yLabel="Kinetic energy $K$ (J)">
            <Fn id="kCurve" f={t => kAt(t)} from={0} to={T} label="Kinetic energy" />
            <Segment id="kCursor" from={[step.t, 0]} to={[step.t, 0.6]} />
            <Points id="kNow" pts={[[step.t, kAt(step.t)]]} />
          </Plot>
          <Plot id="potential" x={[0, T]} y={[0, 0.6]} xLabel="Time $t$ (s)" yLabel="Potential energy $U$ (J)">
            <Fn id="uCurve" f={t => uAt(t)} from={0} to={T} label="Potential energy" />
            <Segment id="uCursor" from={[step.t, 0]} to={[step.t, 0.6]} />
            <Points id="uNow" pts={[[step.t, uAt(step.t)]]} />
          </Plot>
        </Column>
      )}
    />
  );
}
```

