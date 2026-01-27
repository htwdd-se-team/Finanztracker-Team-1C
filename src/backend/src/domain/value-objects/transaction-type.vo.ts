import { DomainException } from "../exceptions/domain.exception";

/**
 * Transaction Type Value Object
 *
 * Represents whether a transaction is an income or expense.
 */
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export class TransactionTypeVO {
  private constructor(private readonly _value: TransactionType) {}

  static income(): TransactionTypeVO {
    return new TransactionTypeVO(TransactionType.INCOME);
  }

  static expense(): TransactionTypeVO {
    return new TransactionTypeVO(TransactionType.EXPENSE);
  }

  static fromString(value: string): TransactionTypeVO {
    const upperValue = value.toUpperCase();
    if (upperValue === "INCOME") {
      return TransactionTypeVO.income();
    }
    if (upperValue === "EXPENSE") {
      return TransactionTypeVO.expense();
    }
    throw new DomainException(`Ungültiger Transaktionstyp: ${value}`);
  }

  isIncome(): boolean {
    return this._value === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this._value === TransactionType.EXPENSE;
  }

  equals(other: TransactionTypeVO): boolean {
    return this._value === other._value;
  }

  get value(): TransactionType {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
