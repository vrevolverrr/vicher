A half adder uses two gates: an XOR gate for the sum and an AND gate for the carry. I can't draw logic gates here, so the wiring is in words.

1. Connect inputs **A** and **B** to an XOR gate. Its output is **Sum**.
2. Connect the same **A** and **B** to an AND gate. Its output is **Carry**.

| A | B | Sum (A XOR B) | Carry (A AND B) |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

Sum is 1 when exactly one input is 1. Carry is 1 only when both inputs are 1. Check: 1 + 1 = 10 in binary, so Sum = 0 and Carry = 1.

Not drawn: the gate symbols. Build the circuit in Logisim, or on a breadboard with a 7486 (quad XOR) and a 7408 (quad AND).