import { component, field } from '@/renderer/figure/components/component';
import { LIMITS } from '@/renderer/figure/FigureData';

const id = field.optional(field.id());
const label = field.optional(field.text());
const tag = field.optional(field.tag());

export const Shape = component({
  name: 'Shape',
  signature: '<Shape pts={[[x, y], ...]} closed label tag id />',
  summary: 'a polyline or polygon: a contour, a parametric curve, a path of iterates, a unit square under a map; one point draws nothing, so a growing path can start empty.',
  fields: { id, pts: field.list(field.point(), { max: LIMITS.shapePoints }), closed: field.optional(field.boolean()), label, tag },
});

export const Circle = component({
  name: 'Circle',
  signature: '<Circle at={[x, y]} r label tag id />',
  summary: 'in a 3D Plot it lies in the plane of x and y at height z (a level set on a bowl).',
  fields: { id, at: field.point(), r: field.number({ above: 0 }), label, tag },
});

export const Vector = component({
  name: 'Vector',
  signature: '<Vector from to label tag id />',
  summary: 'an arrowhead at `to`, no dots.',
  fields: { id, from: field.point(), to: field.point(), label, tag },
});

export const Segment = component({
  name: 'Segment',
  signature: '<Segment from to label tag id />',
  summary: 'a line between two points.',
  fields: { id, from: field.point(), to: field.point(), label, tag },
});

export const Points = component({
  name: 'Points',
  signature: '<Points pts={[[x, y]]} label tag id />',
  summary: 'dots.',
  fields: { id, pts: field.list(field.point(), { max: LIMITS.layerPoints }), label, tag },
});

export const Label = component({
  name: 'Label',
  signature: '<Label at text tag id />',
  summary: 'text at a point.',
  fields: { id, at: field.point(), text: field.text(), tag },
});

export const Angle = component({
  name: 'Angle',
  signature: '<Angle at from to label tag id />',
  summary: 'the arc of the angle at `at` from the ray towards `from` to the ray towards `to`, label outside the arc.',
  fields: { id, at: field.point(), from: field.point(), to: field.point(), label, tag },
});

export const RightAngle = component({
  name: 'RightAngle',
  signature: '<RightAngle at from to tag id />',
  summary: 'the square mark.',
  fields: { id, at: field.point(), from: field.point(), to: field.point(), tag },
});

export const Tick = component({
  name: 'Tick',
  signature: '<Tick on={[a, b]} n tag id />',
  summary: '`n` equal-length ticks across segment a–b.',
  fields: { id, on: field.list(field.point(), { length: 2 }), n: field.optional(field.number({ whole: true, min: 1, max: 8 })), tag },
});

export const Dimension = component({
  name: 'Dimension',
  signature: '<Dimension from to label tag id />',
  summary: 'a measured length with end bars, offset from the drawing.',
  fields: { id, from: field.point(), to: field.point(), label, tag },
});
