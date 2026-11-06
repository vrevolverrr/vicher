**Solution:** $x = \dfrac{4}{11}$, $y = \dfrac{13}{11}$, $z = \dfrac{31}{22}$, $w = \dfrac{59}{22}$

**Step 0: Write the augmented matrix.**

$$\left[\begin{array}{cccc|c}
1 & 2 & -1 & 1 & 4 \\
2 & 3 & 1 & -1 & 3 \\
-1 & 1 & 2 & 2 & 9 \\
3 & -1 & 1 & 1 & 4
\end{array}\right]$$

**Step 1: Clear column 1 below the pivot.**

Do $R_2 \leftarrow R_2 - 2R_1$, $R_3 \leftarrow R_3 + R_1$, $R_4 \leftarrow R_4 - 3R_1$.

$$\left[\begin{array}{cccc|c}
1 & 2 & -1 & 1 & 4 \\
0 & -1 & 3 & -3 & -5 \\
0 & 3 & 1 & 3 & 13 \\
0 & -7 & 4 & -2 & -8
\end{array}\right]$$

**Step 2: Make the column 2 pivot 1, then clear column 2.**

Do $R_2 \leftarrow -R_2$. Then $R_1 \leftarrow R_1 - 2R_2$, $R_3 \leftarrow R_3 - 3R_2$, $R_4 \leftarrow R_4 + 7R_2$.

$$\left[\begin{array}{cccc|c}
1 & 0 & 5 & -5 & -6 \\
0 & 1 & -3 & 3 & 5 \\
0 & 0 & 10 & -6 & -2 \\
0 & 0 & -17 & 19 & 27
\end{array}\right]$$

**Step 3: Make the column 3 pivot 1, then clear column 3.**

Do $R_3 \leftarrow \frac{1}{10}R_3$. Then $R_1 \leftarrow R_1 - 5R_3$, $R_2 \leftarrow R_2 + 3R_3$, $R_4 \leftarrow R_4 + 17R_3$.

$$\left[\begin{array}{cccc|c}
1 & 0 & 0 & -2 & -5 \\
0 & 1 & 0 & \frac{6}{5} & \frac{22}{5} \\
0 & 0 & 1 & -\frac{3}{5} & -\frac{1}{5} \\
0 & 0 & 0 & \frac{44}{5} & \frac{118}{5}
\end{array}\right]$$

**Step 4: Make the column 4 pivot 1, then clear column 4.**

Do $R_4 \leftarrow \frac{5}{44}R_4$. Then $R_1 \leftarrow R_1 + 2R_4$, $R_2 \leftarrow R_2 - \frac{6}{5}R_4$, $R_3 \leftarrow R_3 + \frac{3}{5}R_4$.

$$\left[\begin{array}{cccc|c}
1 & 0 & 0 & 0 & \frac{4}{11} \\
0 & 1 & 0 & 0 & \frac{13}{11} \\
0 & 0 & 1 & 0 & \frac{31}{22} \\
0 & 0 & 0 & 1 & \frac{59}{22}
\end{array}\right]$$

The left side is the identity matrix, so the solution is unique. Each column has a pivot, so the coefficient matrix is invertible.

**Check:** I substituted the values into all four original equations, and each one holds.

Skipped: nothing. Risk: arithmetic errors in the fractions, which the substitution check rules out.