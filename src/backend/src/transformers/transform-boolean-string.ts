import { Transform } from "class-transformer";

export function TransformBooleanString() {
  return Transform(({ value }) => [true, "true", "yes"].indexOf(value) > -1);
}
