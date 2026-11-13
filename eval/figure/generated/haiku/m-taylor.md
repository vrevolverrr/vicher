A Taylor polynomial copies a function near one point. Each added term matches one more feature of the curve at that point, so the polynomial follows the curve over a wider range. Press play below to see sine approximated by degrees 1, 3, 5, 7 and 9.

```figure
const taylorSin = (x, deg) => {
  let sum = 0;
  for (let k = 0; 2 * k + 1 <= deg; k++) {
    let fact = 1;
    for (let j = 2; j <= 2 * k + 1; j++) fact *= j;
    sum += (k % 2 === 0 ? 1 : -1) * Math.pow(x, 2 * k + 1) / fact;
  }
  return sum;
};

const degrees = [1, 3, 5, 7, 9];

export default function () {
  const steps = degrees.map(deg => ({
    deg,
    err: Math.abs(taylorSin(Math.PI / 2, deg) - 1)
  }));
  return (
    <Figure steps={steps}
      caption={step => String.raw`Degree $${step.deg}$ keeps terms up to $x^{${step.deg}}$. At $x=\pi/2$ its error is $${step.err.toPrecision(3)}$.`}
      render={step => (
        <Plot x={[-Math.PI, Math.PI]} y={[-1.5, 1.5]} xLabel="x" yLabel="y">
          <Fn id="sin" f={x => Math.sin(x)} label="sin x" />
          <Fn id="poly" f={x => taylorSin(x, step.deg)} label={String.raw`$P_{${step.deg}}(x)$`} />
        </Plot>
      )} />
  );
}
```

**The definition.** For a function $f$ that can be differentiated $N$ times at $0$, the Taylor polynomial of degree $N$ around $0$ is

$$P_N(x)=\sum_{k=0}^{N}\frac{f^{(k)}(0)}{k!}\,x^k$$

Here $f^{(k)}(0)$ is the $k$-th derivative of $f$ at $0$, and $k!$ is $k$ factorial. Each term adds one more derivative of information.

For $\sin x$, the derivatives at $0$ cycle through $0, 1, 0, -1$. Only odd powers survive, with alternating signs:

$$P_{2n+1}(x)=\sum_{k=0}^{n}\frac{(-1)^k}{(2k+1)!}\,x^{2k+1}$$

**Worked example at $x=\pi/2\approx1.5708$**, where $\sin x=1$:

- $P_1=x=1.5708$. Error $0.571$.
- $P_3=x-\dfrac{x^3}{6}=1.5708-0.6460=0.9248$. Error $0.0752$.
- $P_5=P_3+\dfrac{x^5}{120}=0.9248+0.0797=1.0045$. Error $0.0045$.

Each term is much smaller than the one before it, so the error drops fast. Away from $0$ the error grows, so a wider fit needs more terms.

Not run: I did not execute the figure code here. Check that the pane shows five steps and that the error values match the ones above.