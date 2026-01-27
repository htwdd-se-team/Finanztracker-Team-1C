import { DomainException } from "../exceptions/domain.exception";

/**
 * Recurring Type
 *
 * Defines the interval for recurring transactions.
 */
export enum RecurringType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export class RecurringTypeVO {
  private constructor(private readonly _value: RecurringType) {}

  static daily(): RecurringTypeVO {
    return new RecurringTypeVO(RecurringType.DAILY);
  }

  static weekly(): RecurringTypeVO {
    return new RecurringTypeVO(RecurringType.WEEKLY);
  }

  static monthly(): RecurringTypeVO {
    return new RecurringTypeVO(RecurringType.MONTHLY);
  }

  static fromString(value: string): RecurringTypeVO {
    const upperValue = value.toUpperCase();
    if (upperValue === "DAILY") {
      return RecurringTypeVO.daily();
    }
    if (upperValue === "WEEKLY") {
      return RecurringTypeVO.weekly();
    }
    if (upperValue === "MONTHLY") {
      return RecurringTypeVO.monthly();
    }
    throw new DomainException(`Ungültiger Wiederholungstyp: ${value}`);
  }

  equals(other: RecurringTypeVO): boolean {
    return this._value === other._value;
  }

  get value(): RecurringType {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
