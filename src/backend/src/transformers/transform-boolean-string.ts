import { Transform } from "class-transformer";

export function TransformBooleanString() {
  //  we know that the value is a string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Transform(({ value }) => [true, "true", "yes"].indexOf(value) > -1);
}
