A converging lens bends parallel rays through its far focal point. With focal length $f=10$ cm, the image distance is set by the object distance:

$$\frac{1}{f}=\frac{1}{d_o}+\frac{1}{d_i}$$

Here $d_o$ is the object distance and $d_i$ is the image distance. Move the slider to see the rays meet at the real, inverted image.

```figure
export const params = {
  d: { label: 'Object distance', min: 14, max: 30, step: 1, value: 20, unit: 'cm' }
};

export default function ({ d }) {
  const f = 10;
  const h = 4;
  const di = f * d / (d - f);
  const hi = -h * di / d;
  const farX = 35;

  return (
    <Column gap="sm" align="center">
      <Diagram width={70} height={20}>
        <Segment from={[-35, 0]} to={[35, 0]} label="Optical axis" />
        <Segment from={[0, -8]} to={[0, 8]} label="Converging lens" />
        <Points pts={[[-f, 0], [f, 0]]} label="Focal points" />
        <Label at={[-f, -1.5]} text="$F$" />
        <Label at={[f, -1.5]} text="$F'$" />

        <Vector from={[-d, 0]} to={[-d, h]} label="Object" />
        <Vector from={[di, 0]} to={[di, hi]} label="Image" />

        <Shape pts={[[-d, h], [0, h], [di, hi], [farX, h * (1 - farX / f)]]}
          label="Parallel ray, then through $F'$" group="Ray 1" />
        <Shape pts={[[-d, h], [0, 0], [di, hi], [farX, -h * farX / d]]}
          label="Through the lens center" group="Ray 2" />

        <Label at={[-d, h + 1]} text={`Object, $d_o=${d}$ cm`} />
        <Label at={[di, hi - 1.5]} text={`Image, $d_i=${di.toFixed(1)}$ cm`} />
      </Diagram>
      <Text>Focal length: $10$ cm. The two rays meet at the image.</Text>
    </Column>
  );
}
```

