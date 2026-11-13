A per-unit tax makes sellers require the tax amount on top of their usual price. So the supply curve buyers face shifts up by 20. The tax wedge reduces trade from 40 units to 30.

Before tax, set demand equal to supply:

$$100-Q=20+Q \quad\Rightarrow\quad Q=40,\; P=60$$

After tax, buyers pay the seller’s price plus 20:

$$100-Q=(20+Q)+20 \quad\Rightarrow\quad Q=30$$

At 30 units, buyers pay 70 and sellers receive 50. The 10 units no longer traded would have been worth more to buyers than they cost sellers, so losing those trades creates deadweight loss:

$$\text{DWL}=\frac12(40-30)(70-50)=100$$

```figure
export default function () {
  return (
    <Plot id="market" x={[0, 100]} y={[0, 110]} xLabel="Quantity $Q$" yLabel="Price $P$">
      <Fn id="demand" f={q => 100 - q} label="Demand: $P=100-Q$" />
      <Fn id="supply" f={q => 20 + q} label="Supply: $P=20+Q$" />
      <Fn id="taxedSupply" f={q => 40 + q} label="Supply with tax: $P=40+Q$" />
      <Region id="dwl" top="demand" base="supply" from={30} to={40} label="Deadweight loss" />
      <Points id="before" pts={[[40, 60]]} label="Before tax: $(40,60)$" />
      <Points id="buyerPrice" pts={[[30, 70]]} label="Buyer pays 70" />
      <Points id="sellerPrice" pts={[[30, 50]]} label="Seller receives 50" />
      <Segment id="wedge" from={[30, 50]} to={[30, 70]} label="Tax = 20" />
    </Plot>
  );
}
```

