Start with the augmented matrix. The figure steps through each row operation.

```figure
const steps = [
  {
    caption: 'Start with the augmented matrix.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\2&3&1&-1&3\\-1&1&2&2&9\\3&-1&1&1&4\end{array}\right]`
  },
  {
    caption: 'Use $R_1$ to clear the entries below the first pivot: $R_2\leftarrow2R_1-R_2$, $R_3\leftarrow R_3+R_1$, $R_4\leftarrow R_4-3R_1$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&3&1&3&13\\0&-7&4&-2&-8\end{array}\right]`
  },
  {
    caption: 'Clear the entries below the second pivot: $R_3\leftarrow R_3-3R_2$, $R_4\leftarrow R_4+7R_2$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&10&-6&-2\\0&0&-17&19&27\end{array}\right]`
  },
  {
    caption: 'Combine the last two rows, then simplify: $R_4\leftarrow10R_4+17R_3$, followed by $R_4\leftarrow R_4/4$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&10&-6&-2\\0&0&0&22&59\end{array}\right]`
  },
  {
    caption: 'Normalize the third pivot and clear the $w$ entry above it: $R_3\leftarrow\bigl(R_3+\frac{3}{11}R_4\bigr)/10$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&-3&3&5\\0&0&1&0&\frac{31}{22}\\0&0&0&1&\frac{59}{22}\end{array}\right]`
  },
  {
    caption: 'Clear the $z,w$ entries in $R_2$: $R_2\leftarrow R_2+3R_3-3R_4$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&2&-1&1&4\\0&1&0&0&\frac{13}{11}\\0&0&1&0&\frac{31}{22}\\0&0&0&1&\frac{59}{22}\end{array}\right]`
  },
  {
    caption: 'Clear the remaining entries in $R_1$: $R_1\leftarrow R_1-2R_2+R_3-R_4$.',
    tex: String.raw`\left[\begin{array}{rrrr|r}1&0&0&0&\frac{4}{11}\\0&1&0&0&\frac{13}{11}\\0&0&1&0&\frac{31}{22}\\0&0&0&1&\frac{59}{22}\end{array}\right]`
  }
];

export default function () {
  return <Figure steps={steps} caption={step => step.caption}
    render={step => <Tex id="matrix" tex={step.tex} />} />;
}
```

Thus,

$$
(x,y,z,w)=\left(\frac{4}{11},\frac{13}{11},\frac{31}{22},\frac{59}{22}\right).
$$

