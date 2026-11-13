Row reduction uses row operations to turn the augmented matrix into a form where each variable’s value is clear.

```figure
const steps = [
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\2&3&1&-1&3\\-1&1&2&2&9\\3&-1&1&1&4\end{array}\right]`,
    text: 'Start with the augmented matrix.'
  },
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&-1&3&-3&-5\\0&3&1&3&13\\0&-7&4&-2&-8\end{array}\right]`,
    text: 'Use $R_2-2R_1$, $R_3+R_1$, and $R_4-3R_1$ to clear the first column.'
  },
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&10&-6&-2\\0&0&-17&19&27\end{array}\right]`,
    text: 'Set $R_2\\leftarrow -R_2$, then use $R_3-3R_2$ and $R_4+7R_2$.'
  },
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&1&-\\frac35&-\\frac15\\0&0&0&\\frac{44}{5}&\\frac{118}{5}\end{array}\right]`,
    text: 'Set $R_3\\leftarrow R_3/10$, then $R_4\\leftarrow R_4+17R_3$.'
  },
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&1&0&\\frac{31}{22}\\0&0&0&1&\\frac{59}{22}\end{array}\right]`,
    text: 'Normalize row 4, then use $R_3\\leftarrow R_3+\\frac35R_4$.'
  },
  {
    matrix: String.raw`\left[\begin{array}{rrrr|r}1&0&0&0&\\frac4{11}\\0&1&0&0&\\frac{13}{11}\\0&0&1&0&\\frac{31}{22}\\0&0&0&1&\\frac{59}{22}\end{array}\right]`,
    text: 'Clear the remaining entries above the pivots to reach reduced row echelon form.'
  }
];

export default function () {
  return <Figure steps={steps} caption={step => step.text}
    render={step => <Tex tex={step.matrix} />} />;
}
```

Reading the final matrix gives

$$
(x,y,z,w)=\left(\frac4{11},\frac{13}{11},\frac{31}{22},\frac{59}{22}\right).
$$

