A half adder adds two 1-bit inputs. I can’t draw logic gates in a figure here, but the connections are: send inputs $A$ and $B$ to an XOR gate for the sum, and to an AND gate for the carry.

$$S = A \oplus B$$

$$C = A \land B$$

For example, if $A=B=1$, the XOR output is $S=0$ and the AND output is $C=1$. So the result is binary $10$, which equals 2.

