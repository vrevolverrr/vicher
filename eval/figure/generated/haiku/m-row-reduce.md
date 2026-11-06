**Solution:** $x = \frac{4}{11}$, $y = \frac{13}{11}$, $z = \frac{31}{22}$, $w = \frac{59}{22}$. The system has one solution.

**Step 1. Write the augmented matrix.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 2 & 3 & 1 & -1 & 3 \\ -1 & 1 & 2 & 2 & 9 \\ 3 & -1 & 1 & 1 & 4 \end{array}\right]$$

**Step 2. Clear column 1 below the pivot: $R_2 \leftarrow R_2 - 2R_1$, $R_3 \leftarrow R_3 + R_1$, $R_4 \leftarrow R_4 - 3R_1$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & -1 & 3 & -3 & -5 \\ 0 & 3 & 1 & 3 & 13 \\ 0 & -7 & 4 & -2 & -8 \end{array}\right]$$

**Step 3. Make the column 2 pivot 1: $R_2 \leftarrow -R_2$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & 1 & -3 & 3 & 5 \\ 0 & 3 & 1 & 3 & 13 \\ 0 & -7 & 4 & -2 & -8 \end{array}\right]$$

**Step 4. Clear column 2 below the pivot: $R_3 \leftarrow R_3 - 3R_2$, $R_4 \leftarrow R_4 + 7R_2$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & 1 & -3 & 3 & 5 \\ 0 & 0 & 10 & -6 & -2 \\ 0 & 0 & -17 & 19 & 27 \end{array}\right]$$

**Step 5. Make the column 3 pivot 1: $R_3 \leftarrow \frac{1}{10}R_3$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & 1 & -3 & 3 & 5 \\ 0 & 0 & 1 & -\frac{3}{5} & -\frac{1}{5} \\ 0 & 0 & -17 & 19 & 27 \end{array}\right]$$

**Step 6. Clear column 3 below the pivot: $R_4 \leftarrow R_4 + 17R_3$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & 1 & -3 & 3 & 5 \\ 0 & 0 & 1 & -\frac{3}{5} & -\frac{1}{5} \\ 0 & 0 & 0 & \frac{44}{5} & \frac{118}{5} \end{array}\right]$$

**Step 7. Make the column 4 pivot 1: $R_4 \leftarrow \frac{5}{44}R_4$.** This is row echelon form.

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 1 & 4 \\ 0 & 1 & -3 & 3 & 5 \\ 0 & 0 & 1 & -\frac{3}{5} & -\frac{1}{5} \\ 0 & 0 & 0 & 1 & \frac{59}{22} \end{array}\right]$$

**Step 8. Clear column 4 above the pivot: $R_1 \leftarrow R_1 - R_4$, $R_2 \leftarrow R_2 - 3R_4$, $R_3 \leftarrow R_3 + \frac{3}{5}R_4$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & -1 & 0 & \frac{29}{22} \\ 0 & 1 & -3 & 0 & -\frac{67}{22} \\ 0 & 0 & 1 & 0 & \frac{31}{22} \\ 0 & 0 & 0 & 1 & \frac{59}{22} \end{array}\right]$$

**Step 9. Clear column 3 above the pivot: $R_1 \leftarrow R_1 + R_3$, $R_2 \leftarrow R_2 + 3R_3$.**

$$\left[\begin{array}{cccc|c} 1 & 2 & 0 & 0 & \frac{30}{11} \\ 0 & 1 & 0 & 0 & \frac{13}{11} \\ 0 & 0 & 1 & 0 & \frac{31}{22} \\ 0 & 0 & 0 & 1 & \frac{59}{22} \end{array}\right]$$

**Step 10. Clear column 2 above the pivot: $R_1 \leftarrow R_1 - 2R_2$.** This is reduced row echelon form.

$$\left[\begin{array}{cccc|c} 1 & 0 & 0 & 0 & \frac{4}{11} \\ 0 & 1 & 0 & 0 & \frac{13}{11} \\ 0 & 0 & 1 & 0 & \frac{31}{22} \\ 0 & 0 & 0 & 1 & \frac{59}{22} \end{array}\right]$$

Pivots sit in all four columns, so there are no free variables and the solution is unique. I checked the answer by substituting it into all four original equations; each one holds.

Skipped: nothing.