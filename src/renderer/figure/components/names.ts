/** Elements that join others by id; the core draws them once a step is laid out. */
export const LINK_NAMES = ['Arrow', 'Pointer'] as const;

/** The elements that go in a step, a Row, a Column or a Panel. */
export const BLOCK_NAMES = ['Row', 'Column', 'Panel', 'Table', 'Seq', 'Node', 'Text', 'Tex', 'Graph', 'Quiz', ...LINK_NAMES, 'Plot', 'Diagram'] as const;

/** Layers of both drawings. */
export const SHARED_LAYER_NAMES = ['Shape', 'Circle', 'Vector', 'Segment', 'Points', 'Label'] as const;

/** Every element the model can write, as the worker needs them: names only, so no definition or zod enters the sandbox. A test keeps it equal to `COMPONENTS`. */
export const ELEMENT_NAMES = [...BLOCK_NAMES, ...SHARED_LAYER_NAMES, 'Fn', 'Region', 'Angle', 'RightAngle', 'Tick', 'Dimension'] as const;
