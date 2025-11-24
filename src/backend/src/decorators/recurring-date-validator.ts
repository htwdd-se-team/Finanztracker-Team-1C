import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { DateTime } from "luxon";

export function IsRecurringDateValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isRecurringDateValid",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: Date, args: ValidationArguments) {
          const obj = args.object as { isRecurring?: boolean };

          // If isRecurring is not true, skip validation (this validator only applies to recurring entries)
          if (!obj.isRecurring) {
            return true;
          }

          if (!value) {
            return true;
          }

          const now = DateTime.now();
          const thirtyDaysAgo = now.minus({ days: 30 });
          const valueDateTime = DateTime.fromJSDate(value);

          return valueDateTime >= thirtyDaysAgo;
        },
        defaultMessage() {
          return "For recurring entries, the creation date cannot be more than 30 days in the past.";
        },
      },
    });
  };
}
