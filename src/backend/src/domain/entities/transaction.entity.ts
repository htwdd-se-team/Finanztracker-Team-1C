import { DomainException } from "../exceptions/domain.exception";
import { Money } from "../value-objects/money.vo";
import {
  RecurringType,
  RecurringTypeVO,
} from "../value-objects/recurring-type.vo";
import {
  TransactionType,
  TransactionTypeVO,
} from "../value-objects/transaction-type.vo";

export interface TransactionProps {
  id: number;
  money: Money;
  description: string | null;
  type: TransactionType;
  categoryId: number | null;
  userId: number;
  createdAt: Date;
  isRecurring: boolean;
  recurringType: RecurringType | null;
  recurringBaseInterval: number | null;
  recurringDisabled: boolean | null;
  parentTransactionId: number | null;
}

export interface CreateTransactionProps {
  amount: number;
  currency?: string;
  description?: string | null;
  type: TransactionType;
  categoryId?: number | null;
  userId: number;
  createdAt?: Date;
  isRecurring?: boolean;
  recurringType?: RecurringType | null;
  recurringBaseInterval?: number | null;
  parentTransactionId?: number | null;
}

/**
 * Transaction Domain Entity
 *
 * Rich domain model representing a financial transaction.
 * Contains business logic for:
 * - Creating income/expense transactions
 * - Recurring transaction management
 * - Transaction validation
 */
export class Transaction {
  private constructor(
    private readonly _id: number | null,
    private _money: Money,
    private _description: string | null,
    private _type: TransactionTypeVO,
    private _categoryId: number | null,
    private readonly _userId: number,
    private readonly _createdAt: Date,
    private _isRecurring: boolean,
    private _recurringType: RecurringTypeVO | null,
    private _recurringBaseInterval: number | null,
    private _recurringDisabled: boolean,
    private readonly _parentTransactionId: number | null,
  ) {}

  /**
   * Factory method to create a new Transaction (not yet persisted)
   */
  static create(props: CreateTransactionProps): Transaction {
    const money = Money.create(props.amount, props.currency || "EUR");
    const type = TransactionTypeVO.fromString(props.type);

    // Validation: recurring transactions need a recurring type
    if (props.isRecurring && !props.recurringType) {
      throw new DomainException(
        "Wiederholende Transaktionen benötigen einen Wiederholungstyp",
      );
    }

    // Validation: recurring base interval must be positive if set
    if (
      props.recurringBaseInterval !== undefined &&
      props.recurringBaseInterval !== null &&
      props.recurringBaseInterval <= 0
    ) {
      throw new DomainException("Wiederholungsintervall muss positiv sein");
    }

    const recurringType = props.recurringType
      ? RecurringTypeVO.fromString(props.recurringType)
      : null;

    return new Transaction(
      null, // ID wird erst beim Speichern vergeben
      money,
      props.description || null,
      type,
      props.categoryId || null,
      props.userId,
      props.createdAt || new Date(),
      props.isRecurring || false,
      recurringType,
      props.recurringBaseInterval || null,
      false, // New transactions are not disabled
      props.parentTransactionId || null,
    );
  }

  /**
   * Reconstitute a Transaction from persistence
   */
  static reconstitute(props: TransactionProps): Transaction {
    const money = Money.create(props.money.amount, props.money.currency);
    const type = TransactionTypeVO.fromString(props.type);
    const recurringType = props.recurringType
      ? RecurringTypeVO.fromString(props.recurringType)
      : null;

    return new Transaction(
      props.id,
      money,
      props.description,
      type,
      props.categoryId,
      props.userId,
      props.createdAt,
      props.isRecurring,
      recurringType,
      props.recurringBaseInterval,
      props.recurringDisabled || false,
      props.parentTransactionId,
    );
  }

  /**
   * Domain behavior: Update transaction details
   */
  updateDetails(
    amount?: number,
    currency?: string,
    description?: string | null,
    type?: TransactionType,
    categoryId?: number | null,
  ): void {
    if (amount !== undefined || currency !== undefined) {
      this._money = Money.create(
        amount !== undefined ? amount : this._money.amount,
        currency !== undefined ? currency : this._money.currency,
      );
    }

    if (description !== undefined) {
      this._description = description;
    }

    if (type !== undefined) {
      this._type = TransactionTypeVO.fromString(type);
    }

    if (categoryId !== undefined) {
      this._categoryId = categoryId;
    }
  }

  /**
   * Domain behavior: Make transaction recurring
   */
  makeRecurring(recurringType: RecurringType, baseInterval = 1): void {
    if (baseInterval <= 0) {
      throw new DomainException("Wiederholungsintervall muss positiv sein");
    }

    this._isRecurring = true;
    this._recurringType = RecurringTypeVO.fromString(recurringType);
    this._recurringBaseInterval = baseInterval;
    this._recurringDisabled = false;
  }

  /**
   * Domain behavior: Disable recurring transaction
   */
  disableRecurring(): void {
    if (!this._isRecurring) {
      throw new DomainException("Transaction ist nicht wiederholend");
    }
    this._recurringDisabled = true;
  }

  /**
   * Domain behavior: Enable recurring transaction
   */
  enableRecurring(): void {
    if (!this._isRecurring) {
      throw new DomainException("Transaction ist nicht wiederholend");
    }
    this._recurringDisabled = false;
  }

  /**
   * Domain behavior: Check if transaction belongs to a user
   */
  belongsToUser(userId: number): boolean {
    return this._userId === userId;
  }

  /**
   * Domain query: Is this an income transaction?
   */
  isIncome(): boolean {
    return this._type.isIncome();
  }

  /**
   * Domain query: Is this an expense transaction?
   */
  isExpense(): boolean {
    return this._type.isExpense();
  }

  /**
   * Domain query: Is this a recurring transaction?
   */
  isRecurringTransaction(): boolean {
    return this._isRecurring;
  }

  /**
   * Domain query: Is this recurring transaction active?
   */
  isRecurringActive(): boolean {
    return this._isRecurring && !this._recurringDisabled;
  }

  /**
   * Domain query: Is this a child of a recurring transaction?
   */
  isChildTransaction(): boolean {
    return this._parentTransactionId !== null;
  }

  /**
   * Domain query: Is this a parent recurring transaction?
   */
  isParentTransaction(): boolean {
    return this._isRecurring && this._parentTransactionId === null;
  }

  // Immutable getters
  get id(): number | null {
    return this._id;
  }

  get money(): Money {
    return this._money;
  }

  get description(): string | null {
    return this._description;
  }

  get type(): TransactionType {
    return this._type.value;
  }

  get categoryId(): number | null {
    return this._categoryId;
  }

  get userId(): number {
    return this._userId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isRecurring(): boolean {
    return this._isRecurring;
  }

  get recurringType(): RecurringType | null {
    return this._recurringType?.value || null;
  }

  get recurringBaseInterval(): number | null {
    return this._recurringBaseInterval;
  }

  get recurringDisabled(): boolean {
    return this._recurringDisabled;
  }

  get parentTransactionId(): number | null {
    return this._parentTransactionId;
  }
}
