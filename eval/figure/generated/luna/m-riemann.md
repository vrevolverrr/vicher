Each rectangle’s height comes from the curve at its left edge. Change **Rectangles** to see how the approximation changes.

```figure
export const params = {
  n: { label: 'Rectangles', min: 1, max: 12, step: 1, value: 4 }
};

export default function ({ n }) {
  return (
    <Plot x={[0, 2]} y={[0, 4]} xLabel="x" yLabel="y">
      {Array.from({ length: n }, (_, i) => {
        const left = 2 * i / n;
        return (
          <Region
            id={`rectangle${i}`}
            top={left * left}
            from={left}
            to={2 * (i + 1) / n}
            label="Left rectangles"
          />
        );
      })}
      <Fn id="curve" f={x => x * x} from={0} to={2} label="$x^2$" />
    </Plot>
  );
}
```

