A string fixed at both ends must have zero displacement at each end. Its **harmonics** are the standing-wave patterns that fit between those fixed points: the first harmonic has one loop, the second has two, and so on.

For a string of length $L$, the $n$th harmonic’s shape at maximum displacement is

$$
y_n(x)=A\sin\left(\frac{n\pi x}{L}\right)
$$

Here $x$ is position along the string, $A$ is the amplitude, and $n=1,2,3,\ldots$ counts the harmonic. The harmonic frequencies are whole-number multiples of the first harmonic:

$$
f_n=n f_1
$$

```figure
export default function () {
  return (
    <Plot id="harmonics" x={[0, 1]} y={[-1.1, 1.1]} xLabel="Position along string, $x/L$" yLabel="Displacement">
      <Fn id="h1" f={x => Math.sin(Math.PI * x)} label="1st: $n=1$" />
      <Fn id="h2" f={x => Math.sin(2 * Math.PI * x)} label="2nd: $n=2$" />
      <Fn id="h3" f={x => Math.sin(3 * Math.PI * x)} label="3rd: $n=3$" />
      <Points pts={[[0, 0], [1, 0]]} label="Fixed ends" />
    </Plot>
  );
}
```

Each curve shows a snapshot of one harmonic. The ends stay at zero; the interior points that also stay at zero are called **nodes**.

