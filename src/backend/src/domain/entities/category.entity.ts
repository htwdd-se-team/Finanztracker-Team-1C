import { DomainException } from "../exceptions/domain.exception";

export interface CategoryProps {
  id: number;
  name: string;
  color: string;
  icon: string;
  userId: number;
  createdAt: Date;
}

export interface CreateCategoryProps {
  name: string;
  color: string;
  icon: string;
  userId: number;
}

/**
 * Category Domain Entity
 *
 * Rich domain model with business logic and validation.
 * Represents a transaction category with visual attributes.
 */
export class Category {
  private constructor(
    private readonly _id: number | null,
    private _name: string,
    private _color: string,
    private _icon: string,
    private readonly _userId: number,
    private readonly _createdAt: Date,
  ) {}

  /**
   * Factory method to create a new Category (not yet persisted)
   */
  static create(props: CreateCategoryProps): Category {
    Category.validateName(props.name);
    Category.validateColor(props.color);
    Category.validateIcon(props.icon);

    return new Category(
      null, // ID wird erst beim Speichern vergeben
      props.name.trim(),
      props.color,
      props.icon,
      props.userId,
      new Date(),
    );
  }

  /**
   * Reconstitute a Category from persistence
   */
  static reconstitute(props: CategoryProps): Category {
    return new Category(
      props.id,
      props.name,
      props.color,
      props.icon,
      props.userId,
      props.createdAt,
    );
  }

  /**
   * Domain behavior: Update category details
   */
  updateDetails(name?: string, color?: string, icon?: string): void {
    if (name !== undefined) {
      Category.validateName(name);
      this._name = name.trim();
    }

    if (color !== undefined) {
      Category.validateColor(color);
      this._color = color;
    }

    if (icon !== undefined) {
      Category.validateIcon(icon);
      this._icon = icon;
    }
  }

  /**
   * Domain behavior: Check if category belongs to a user
   */
  belongsToUser(userId: number): boolean {
    return this._userId === userId;
  }

  // Validation rules (business logic in domain layer)
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException("Kategoriename darf nicht leer sein");
    }

    if (name.trim().length > 100) {
      throw new DomainException(
        "Kategoriename darf maximal 100 Zeichen lang sein",
      );
    }
  }

  private static validateColor(color: string): void {
    if (!color || color.trim().length === 0) {
      throw new DomainException("Kategoriefarbe muss angegeben werden");
    }
  }

  private static validateIcon(icon: string): void {
    if (!icon || icon.trim().length === 0) {
      throw new DomainException("Kategoriesymbol muss angegeben werden");
    }
  }

  // Immutable getters
  get id(): number | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  get icon(): string {
    return this._icon;
  }

  get userId(): number {
    return this._userId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
