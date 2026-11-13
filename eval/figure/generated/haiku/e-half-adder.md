A half adder is two gates that share two inputs: an XOR gate for **Sum** and an AND gate for **Carry**. I can't draw gate symbols as a figure, so here is the wiring in words.

A half adder adds two single bits. Its inputs are $A$ and $B$. Its outputs are Sum, the low bit of the result, and Carry, the high bit. In binary, $1 + 1 = 10$.

The wiring:

1. Connect input $A$ and input $B$ to an **XOR gate**. Its output is Sum.
2. Connect the same $A$ and $B$ wires to an **AND gate**. Its output is Carry.

Each input wire splits into two branches, one to each gate. No other parts are needed.

The rules:

$$\text{Sum} = A \oplus B$$

$$\text{Carry} = A \cdot B$$

Here $\oplus$ is XOR, which outputs 1 only when the inputs differ. $\cdot$ is AND, which outputs 1 only when both inputs are 1.

| A | B | Sum | Carry |
|---|---|-----|-------|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

Worked example, $A = 1$, $B = 1$: Sum $= 1 \oplus 1 = 0$ and Carry $= 1 \cdot 1 = 1$. The result is $10_2 = 2$.

A half adder cannot accept a carry from a lower bit. A full adder joins two half adders with an OR gate to do that.

Skipped: a drawn schematic. Risk: none.