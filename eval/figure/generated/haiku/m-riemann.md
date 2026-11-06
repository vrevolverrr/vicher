Drag the **Rectangles** slider. Each rectangle's height is $f(x)=x^2$ at its left edge.

```figure
export const params = { n: { label: 'Rectangles', min: 1, max: 20, step: 1, value: 4 } };

export default function ({ n }) {
  const a = 0, b = 2;
  const dx = (b - a) / n;
  const rects = Array.from({ length: n }, (_, i) => {
    const left = a + i * dx;
    return { i, left, h: left * left };
  });
  const sum = rects.reduce((s, r) => s + r.h * dx, 0);

  return (
    <Row gap="lg" align="center">
      <Plot id="plot" x={[-0.2, 2.3]} y={[-0.4, 4.6]} xLabel="x" yLabel="y">
        <Fn id="f" f={x => x * x} from={0} to={2} label="$y = x^2$" />
        {rects.map(r => (
          <Region id={`r${r.i}`} top={r.h} from={r.left} to={r.left + dx} />
        ))}
      </Plot>
      <Column gap="sm">
        <Text>{`Rectangles: ${n}`}</Text>
        <Text>{String.raw`Width $\Delta x = ${dx}$`}</Text>
        <Text>{`Left sum: ${sum.toFixed(4)}`}</Text>
        <Text>{`Exact area: 8/3 ≈ 2.6667`}</Text>
      </Column>
    </Row>
  );
}
```

As $n$ grows, the left sum is $L_n = \dfrac{4(n-1)(2n-1)}{3n^2}$, which approaches $\tfrac{8}{3}$ from below.

Not checked: I did not render the figure, so confirm it draws in your pane.