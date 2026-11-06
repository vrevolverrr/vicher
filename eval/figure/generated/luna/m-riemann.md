I’ll show the rectangles on the curve and add a control for the rectangle count.

A **left Riemann sum** estimates the area under a curve by adding rectangles. Each rectangle’s height comes from the curve’s value at the left edge of its interval.

For $f(x)=x^2$ on $[0,2]$, using $n$ equal-width rectangles:

$$L_n=\Delta x\sum_{i=0}^{n-1}f(i\Delta x),\qquad \Delta x=\frac{2}{n}$$

For example, with $n=4$, the width is $0.5$. The left-edge heights are $0$, $0.25$, $1$, and $2.25$, so the estimated area is $0.5(0+0.25+1+2.25)=1.75$.

```figure
export const params = {
  n: { label: 'Rectangles', min: 1, max: 12, step: 1, value: 4 }
};

export default function ({ n }) {
  const width = 2 / n;
  const bars = Array.from({ length: n }, (_, i) => ({
    from: i * width,
    to: (i + 1) * width,
    height: (i * width) ** 2
  }));
  const sum = bars.reduce((total, bar) => total + width * bar.height, 0);

  return (
    <Column gap="sm">
      <Plot x={[0, 2]} y={[0, 4.4]} xLabel="x" yLabel="y">
        {bars.map((bar, i) => (
          <Region
            id={`bar${i}`}
            key={i}
            top={bar.height}
            base={0}
            from={bar.from}
            to={bar.to}
            group="rectangles"
          />
        ))}
        <Fn id="curve" f={x => x * x} label="$y=x^2$" />
        <Points
          id="leftEdges"
          pts={bars.map(bar => [bar.from, bar.height])}
          label="Left-edge heights"
        />
      </Plot>
      <Text>{`With $n=${n}$ rectangles, the left sum is $${sum.toFixed(4)}$.`}</Text>
    </Column>
  );
}
```

