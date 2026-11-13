Move the object closer to or farther from the converging lens to see how the image changes. The focal length is fixed at 10 cm.

```figure
export const params = {
  u: { label: 'Object distance', min: 12, max: 30, step: 1, value: 20, unit: 'cm' }
};

export default function ({ u }) {
  const f = 10;
  const h = 4;
  const v = (f * u) / (u - f);
  const imageHeight = -(v / u) * h;
  const thirdRayHeight = imageHeight;
  const extentY = Math.max(h, Math.abs(imageHeight), Math.abs(thirdRayHeight)) + 2;

  return (
    <Diagram width={u + v + 6} height={2 * extentY}>
      <Shape pts={[[-u - 2, 0], [v + 2, 0]]} label="Optical axis" />
      <Shape pts={[[0, -4], [0.7, -2], [1, 0], [0.7, 2], [0, 4], [-0.7, 2], [-1, 0], [-0.7, -2]]} closed label="Lens" />
      <Vector from={[-u, 0]} to={[-u, h]} label="Object" />
      <Vector from={[v, 0]} to={[v, imageHeight]} label="Image" />
      <Shape pts={[[-u, h], [0, h], [v, imageHeight]]} label="Parallel ray, then through far focus" />
      <Shape pts={[[-u, h], [v, imageHeight]]} label="Ray through lens center" />
      <Shape pts={[[-u, h], [0, thirdRayHeight], [v, thirdRayHeight]]} label="Through near focus, then parallel" />
      <Points pts={[[-f, 0], [f, 0]]} label="Focal points" />
      <Label at={[-f, -1.5]} text="$F$" />
      <Label at={[f, -1.5]} text="$F$" />
    </Diagram>
  );
}
```

The image distance follows the thin lens rule:

$$\frac{1}{f}=\frac{1}{u}+\frac{1}{v}$$

Here $f$ is focal length, $u$ is object distance, and $v$ is image distance; the slider stays beyond the focal point, so the image is real and inverted.

