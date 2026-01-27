/**
 * Domain Exception
 *
 * Thrown when domain rules are violated.
 * Should be caught at application layer and converted to appropriate HTTP responses.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainException";
  }
}
