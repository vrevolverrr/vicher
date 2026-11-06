```figure
export const params = {
  u: { label: 'Object distance', min: 16, max: 30, step: 1, value: 20, unit: 'cm' }
};

export default function ({ u }) {
  const f = 10;
  const v = (f * u) / (u - f);
  const lensX = 40;
  const axisY = 9;
  const objectX = lensX - u;
  const imageX = lensX + v;
  const imageY = axisY - (v / u) * 4;

  return (
    <Column gap="md">
      <Text>{`Focal length: **10 cm**. The image is real and inverted.`}</Text>
      <Diagram width={80} height={18}>
        <Segment from={[0, axisY]} to={[80, axisY]} label="optical axis" />
        <Shape
          pts={[[40, 3], [38.8, 5], [38, 9], [38.8, 13], [40, 15], [41.2, 13], [42, 9], [41.2, 5], [40, 3]]}
          closed
          label="converging lens"
          group="lens"
        />
        <Points pts={[[30, axisY], [50, axisY]]} label="F" group="focus" />
        <Vector from={[objectX, axisY]} to={[objectX, 13]} label="object" group="object" />
        <Vector from={[imageX, axisY]} to={[imageX, imageY]} label="image" group="image" />
        <Segment from={[objectX, 13]} to={[lensX, 13]} label="parallel ray" group="ray" />
        <Segment from={[lensX, 13]} to={[imageX, imageY]} group="ray" />
        <Segment from={[objectX, 13]} to={[imageX, imageY]} label="through lens centre" group="ray" />
      </Diagram>
    </Column>
  );
}
```

