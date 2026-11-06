I’ll calculate the fixed monthly payment and track the balance month by month, rounding each payment component to cents.

The loan payment is about **$1,063.69 per month**. Each month, interest is calculated on the remaining balance; the rest of the payment reduces the loan. The final payment is adjusted by 12 cents to clear the balance after rounding.

For loan amount $L$, monthly rate $i$, and $n$ monthly payments, the fixed payment is:

$$
A = \frac{Li}{1-(1+i)^{-n}}
$$

Here $L=\$24{,}000$, $i=0.06/12=0.005$, and $n=24$, giving an unrounded payment of $A\approx\$1{,}063.6946$.

```figure
const months = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const interest = [120,115.28,110.54,105.77,100.98,96.17,91.33,86.47,81.59,76.67,71.74,66.78,61.80,56.79,51.75,46.69,41.61,36.50,31.36,26.20,21.01,15.80,10.56,5.29];
const principal = [943.69,948.41,953.15,957.92,962.71,967.52,972.36,977.22,982.10,987.02,991.95,996.91,1001.89,1006.90,1011.94,1017,1022.08,1027.19,1032.33,1037.49,1042.68,1047.89,1053.13,1058.52];

function valueAt(values, x) {
  const index = Math.min(Math.floor(x) - 1, values.length - 2);
  const t = x - (index + 1);
  return values[index] + t * (values[index + 1] - values[index]);
}

export default function () {
  return (
    <Plot id="amortization" x={[1, 24]} y={[0, 1200]} xLabel="Month" yLabel="Amount ($)">
      <Fn id="interest" f={x => valueAt(interest, x)} from={1} to={24} label="Interest" />
      <Fn id="principal" f={x => valueAt(principal, x)} from={1} to={24} label="Principal" />
    </Plot>
  );
}
```

| Month | Payment | Principal | Interest | Balance after payment |
|---:|---:|---:|---:|---:|
| 1 | $1,063.69 | $943.69 | $120.00 | $23,056.31 |
| 2 | $1,063.69 | $948.41 | $115.28 | $22,107.90 |
| 3 | $1,063.69 | $953.15 | $110.54 | $21,154.75 |
| 4 | $1,063.69 | $957.92 | $105.77 | $20,196.83 |
| 5 | $1,063.69 | $962.71 | $100.98 | $19,234.12 |
| 6 | $1,063.69 | $967.52 | $96.17 | $18,266.60 |
| 7 | $1,063.69 | $972.36 | $91.33 | $17,294.24 |
| 8 | $1,063.69 | $977.22 | $86.47 | $16,317.02 |
| 9 | $1,063.69 | $982.10 | $81.59 | $15,334.92 |
| 10 | $1,063.69 | $987.02 | $76.67 | $14,347.90 |
| 11 | $1,063.69 | $991.95 | $71.74 | $13,355.95 |
| 12 | $1,063.69 | $996.91 | $66.78 | $12,359.04 |
| 13 | $1,063.69 | $1,001.89 | $61.80 | $11,357.15 |
| 14 | $1,063.69 | $1,006.90 | $56.79 | $10,350.25 |
| 15 | $1,063.69 | $1,011.94 | $51.75 | $9,338.31 |
| 16 | $1,063.69 | $1,017.00 | $46.69 | $8,321.31 |
| 17 | $1,063.69 | $1,022.08 | $41.61 | $7,299.23 |
| 18 | $1,063.69 | $1,027.19 | $36.50 | $6,272.04 |
| 19 | $1,063.69 | $1,032.33 | $31.36 | $5,239.71 |
| 20 | $1,063.69 | $1,037.49 | $26.20 | $4,202.22 |
| 21 | $1,063.69 | $1,042.68 | $21.01 | $3,159.54 |
| 22 | $1,063.69 | $1,047.89 | $15.80 | $2,111.65 |
| 23 | $1,063.69 | $1,053.13 | $10.56 | $1,058.52 |
| 24 | $1,063.81 | $1,058.52 | $5.29 | $0.00 |

**Total paid:** $25,528.68. **Total interest:** $1,528.68.

