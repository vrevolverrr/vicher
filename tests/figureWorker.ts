import { readFileSync } from 'node:fs';
import path from 'node:path';

export default readFileSync(path.join(import.meta.dirname, '../node_modules/.cache/vicher/figure-worker.js'), 'utf8');
