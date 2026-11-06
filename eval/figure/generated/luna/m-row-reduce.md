I’ll eliminate entries below each pivot, scale the pivots to 1, then clear the entries above them.

```figure
const steps = [
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
2&3&1&-1&3\\
-1&1&2&2&9\\
3&-1&1&1&4
\end{array}\right]`,
    text: 'Start with the augmented matrix.'
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
0&-1&3&-3&-5\\
0&3&1&3&13\\
0&-7&4&-2&-8
\end{array}\right]`,
    text: String.raw`Use $R_2\leftarrow R_2-2R_1$, $R_3\leftarrow R_3+R_1$, and $R_4\leftarrow R_4-3R_1$.`
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
0&1&-3&3&5\\
0&0&10&-6&-2\\
0&0&-17&19&27
\end{array}\right]`,
    text: String.raw`Make the second pivot $1$, then clear below it: $R_2\leftarrow -R_2$, $R_3\leftarrow R_3-3R_2$, $R_4\leftarrow R_4+7R_2$.`
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
0&1&-3&3&5\\
0&0&5&-3&-1\\
0&0&0&\frac{44}{5}&\frac{118}{5}
\end{array}\right]`,
    text: String.raw`Set $R_3\leftarrow \frac12R_3$, then $R_4\leftarrow R_4+\frac{17}{5}R_3$ to clear the third column below its pivot.`
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
0&1&-3&3&5\\
0&0&5&-3&-1\\
0&0&0&1&\frac{59}{22}
\end{array}\right]`,
    text: String.raw`Scale the last row: $R_4\leftarrow\frac{5}{44}R_4$.`
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&2&-1&1&4\\
0&1&0&0&\frac{13}{11}\\
0&0&1&0&\frac{31}{22}\\
0&0&0&1&\frac{59}{22}
\end{array}\right]`,
    text: String.raw`Clear the fourth column above its pivot, then scale row 3: $R_3\leftarrow\frac15(R_3+3R_4)$; $R_2\leftarrow R_2+3R_3-3R_4$.`
  },
  {
    tex: String.raw`\left[\begin{array}{rrrr|r}
1&0&0&0&\frac4{11}\\
0&1&0&0&\frac{13}{11}\\
0&0&1&0&\frac{31}{22}\\
0&0&0&1&\frac{59}{22}
\end{array}\right]`,
    text: String.raw`Finish with $R_1\leftarrow R_1-2R_2+R_3-R_4$. The left side is now the identity matrix.`
  }
];

export default function () {
  return <Figure steps={steps} caption={step => step.text} render={step => (
    <Tex tex={step.tex} />
  )} />;
}
```

Reading the last column gives the solution:

$$
(x,y,z,w)=\left(\frac{4}{11},\frac{13}{11},\frac{31}{22},\frac{59}{22}\right).
$$

