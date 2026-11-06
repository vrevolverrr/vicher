A level curve shows where $f(x,y)$ has one fixed value. The gradient points toward the steepest increase and is perpendicular to the level curve. Here,

$$
\nabla f(x,y) = (2x,-2y)
$$

The arrows below show scaled gradients at three points.

```figure
const pos = c => x => x * x >= c ? Math.sqrt(x * x - c) : NaN;
const neg = c => x => x * x >= c ? -Math.sqrt(x * x - c) : NaN;
const lower = a => x => Math.sqrt(x * x + a);
const upper = a => x => -Math.sqrt(x * x + a);

export default function () {
  return (
    <Plot x={[-3, 3]} y={[-3, 3]} xLabel="x" yLabel="y" equal>
      <Fn id="c1a" f={pos(1)} label="$f=1$" />
      <Fn id="c1b" f={neg(1)} label="$f=1$" />
      <Fn id="c4a" f={pos(4)} label="$f=4$" />
      <Fn id="c4b" f={neg(4)} label="$f=4$" />
      <Fn id="cm1a" f={lower(1)} label="$f=-1$" />
      <Fn id="cm1b" f={upper(1)} label="$f=-1$" />
      <Fn id="cm4a" f={lower(4)} label="$f=-4$" />
      <Fn id="cm4b" f={upper(4)} label="$f=-4$" />
      <Fn id="c0a" f={x => x} label="$f=0$" />
      <Fn id="c0b" f={x => -x} label="$f=0$" />
      <Points id="p1" pts={[[1, 1]]} label="(1, 1)" />
      <Vector id="g1" from={[1, 1]} to={[1.5, 0.5]} label="$\nabla f=(2,-2)$" />
      <Points id="p2" pts={[[2, 1]]} label="(2, 1)" />
      <Vector id="g2" from={[2, 1]} to={[3, 0.5]} label="$\nabla f=(4,-2)$" />
      <Points id="p3" pts={[[-1, 2]]} label="(-1, 2)" />
      <Vector id="g3" from={[-1, 2]} to={[-1.5, 1]} label="$\nabla f=(-2,-4)$" />
    </Plot>
  );
}
```

