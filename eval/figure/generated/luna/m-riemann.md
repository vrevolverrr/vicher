```figure
export const params = {
  n: { label: 'Rectangles', min: 1, max: 12, step: 1, value: 4 }
};

export default function ({ n }) {
  const width = 2 / n;
  return (
    <Plot id="riemann" x={[0, 2]} y={[0, 4.5]} xLabel="x" yLabel="y">
      <Fn id="curve" f={x => x * x} from={0} to={2} label="$y=x^2$" />
      {Array.from({ length: n }, (_, i) => {
        const left = i * width;
        return (
          <Region
            id={`bar-${i}`}
            top={left * left}
            from={left}
            to={left + width}
            label={i === 0 ? 'Left rectangles' : undefined}
          />
        );
      })}
    </Plot>
  );
}
```

