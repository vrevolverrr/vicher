A bank reconciliation explains why the bank statement and the cash balance in your books differ, then adjusts each to the same cash balance.

**Adjust the bank balance** for items the bank has not recorded yet:

$$8{,}400 - 1{,}200 + 900 = 8{,}100$$

Subtract the $1,200 in outstanding cheques and add the $900 deposit in transit. The adjusted bank balance is **$8,100**.

**Adjust the book balance** for items the bank recorded but your books have not, plus the recording error:

$$7{,}950 - 50 - 200 + 90 = 7{,}790$$

Subtract the $50 bank fee and $200 NSF cheque. Add $90 because the cheque was for $450 but recorded as $540, so the books reduced cash by $90 too much. The adjusted book balance is **$7,790**.

```figure
export default function () {
  return (
    <Row gap="md" align="center">
      <Panel title="Bank side">
        <Node label="$8,100" sub="adjusted bank balance" />
      </Panel>
      <Panel title="Book side">
        <Node label="$7,790" sub="adjusted book balance" />
      </Panel>
      <Panel title="Difference">
        <Node label="$310" sub="still unexplained" />
      </Panel>
    </Row>
  );
}
```

The two adjusted balances should match, but they differ by **$310**. So at least one item may be missing or misstated; the figures given do not fully reconcile.

