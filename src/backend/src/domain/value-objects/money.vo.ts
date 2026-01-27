import { DomainException } from "../exceptions/domain.exception";

/**
 * Money Value Object
 *
 * Represents a monetary amount with currency.
 * Immutable value object with business rules.
 */
export class Money {
  private static readonly SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP"] as const;

  private constructor(
    private readonly _amount: number, // in cents
    private readonly _currency: string,
  ) {}

  static create(amount: number, currency = "EUR"): Money {
    Money.validateAmount(amount);
    Money.validateCurrency(currency);
    return new Money(amount, currency);
  }

  /**
   * Add two money amounts (must have same currency)
   */
  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new DomainException(
        `Währungen müssen übereinstimmen: ${this._currency} vs ${other._currency}`,
      );
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Subtract two money amounts (must have same currency)
   */
  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new DomainException(
        `Währungen müssen übereinstimmen: ${this._currency} vs ${other._currency}`,
      );
    }
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Check if amount is positive
   */
  isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * Check if amount is negative
   */
  isNegative(): boolean {
    return this._amount < 0;
  }

  /**
   * Check if amount is zero
   */
  isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * Value Object equality
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  private static validateAmount(amount: number): void {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new DomainException("Betrag muss eine Zahl sein");
    }

    if (!Number.isInteger(amount)) {
      throw new DomainException(
        "Betrag muss in Cents (ganzzahlig) angegeben werden",
      );
    }
  }

  private static validateCurrency(currency: string): void {
    // Type assertion needed because SUPPORTED_CURRENCIES is a readonly tuple
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!Money.SUPPORTED_CURRENCIES.includes(currency as any)) {
      throw new DomainException(
        `Ungültige Währung: ${currency}. Unterstützt: ${Money.SUPPORTED_CURRENCIES.join(", ")}`,
      );
    }
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  /**
   * Format for display (e.g., "12.50 EUR")
   */
  format(): string {
    const amountInUnits = this._amount / 100;
    return `${amountInUnits.toFixed(2)} ${this._currency}`;
  }
}
