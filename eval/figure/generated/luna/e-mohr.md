Mohr’s circle shows how the normal stress $\sigma$ and shear stress $\tau$ on a plane change as the plane rotates. Using the convention that positive $\tau_{xy}$ plots upward, the two stress points are $(\sigma_x,\tau_{xy})=(80,30)$ MPa and $(\sigma_y,-\tau_{xy})=(-20,-30)$ MPa.

The center lies halfway between the normal stresses, and the radius combines half their difference with the shear stress:

$$
C=\frac{\sigma_x+\sigma_y}{2}
$$

$$
R=\sqrt{\left(\frac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2}
$$

Here, $C=(80-20)/2=30$ MPa and $R=\sqrt{50^2+30^2}\approx58.3$ MPa. So the principal stresses, where shear stress is zero, are $C\pm R\approx88.3$ MPa and $-28.3$ MPa.

```figure
export default function () {
  const cx = 30, cy = 0, r = Math.sqrt(50 ** 2 + 30 ** 2);
  const circle = Array.from({ length: 81 }, (_, i) => {
    const a = 2 * Math.PI * i / 80;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  return (
    <Plot x={[-40, 100]} y={[-70, 70]} xLabel="Normal stress, $\\sigma$ (MPa)" yLabel="Shear stress, $\\tau$ (MPa)">
      <Shape id="circle" pts={circle} closed label="Mohr’s circle" />
      <Points id="stress-points" pts={[[80, 30], [-20, -30]]} label="Stress points" />
      <Points id="center" pts={[[30, 0]]} label="Center $C=(30,0)$" />
      <Label at={[80, 30]} text="$X=(80,30)$" />
      <Label at={[-20, -30]} text="$Y=(-20,-30)$" />
    </Plot>
  );
}
```


