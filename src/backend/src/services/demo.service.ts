import { Injectable, Logger } from "@nestjs/common";
import {
  RecurringTransactionType,
  TransactionType,
  User,
} from "@prisma/client";
import { DateTime } from "luxon";

import { RegisterDto } from "../dto";

import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";

interface DemoCategory {
  name: string;
  color: string;
  icon: string;
}

interface DemoTransaction {
  type: TransactionType;
  amount: number;
  description: string;
  categoryName: string;
  createdAt: Date;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  // Demo categories configuration (using valid IconNames from frontend)
  private readonly DEMO_CATEGORIES: DemoCategory[] = [
    { name: "Gehalt", color: "green", icon: "dollar-sign" },
    { name: "Lebensmittel", color: "orange", icon: "shopping-cart" },
    { name: "Wohnung", color: "blue", icon: "home" },
    { name: "Transport", color: "purple", icon: "car" },
    { name: "Freizeit", color: "pink", icon: "gamepad2" },
  ];

  // Monthly salary in cents (2500€)
  private readonly SALARY_AMOUNT = 250000;

  // Fixed monthly expenses in cents
  private readonly RENT_AMOUNT = 75000; // 750€
  private readonly SUBSCRIPTIONS_AMOUNT = 3000; // 30€ (Netflix, Spotify)
  private readonly INSURANCE_AMOUNT = 8000; // 80€ (liability insurance)
  private readonly UTILITIES_AMOUNT = 8000; // 80€ (electricity, internet)

  // Variable expense ranges in cents
  private readonly GROCERIES_MIN = 28000; // 280€
  private readonly GROCERIES_MAX = 38000; // 380€
  private readonly TRANSPORT_MIN = 5000; // 50€
  private readonly TRANSPORT_MAX = 10000; // 100€
  private readonly ENTERTAINMENT_MIN = 6000; // 60€
  private readonly ENTERTAINMENT_MAX = 12000; // 120€

  // Balance threshold for triggering big purchases (5000€)
  private readonly SPLURGE_THRESHOLD = 500000;

  // Random events (regular throughout the year)
  private readonly RANDOM_EVENTS = [
    { description: "Trip to Berlin", minAmount: 15000, maxAmount: 30000 },
    { description: "Concert tickets", minAmount: 4000, maxAmount: 8000 },
    { description: "Birthday gift", minAmount: 2000, maxAmount: 5000 },
    { description: "New clothes", minAmount: 4000, maxAmount: 10000 },
    { description: "Restaurant dinner", minAmount: 3000, maxAmount: 7000 },
    { description: "Weekend trip", minAmount: 10000, maxAmount: 20000 },
    { description: "Electronics purchase", minAmount: 5000, maxAmount: 15000 },
    { description: "Medical expenses", minAmount: 2000, maxAmount: 6000 },
    { description: "Home repair", minAmount: 3000, maxAmount: 10000 },
    { description: "Gym membership", minAmount: 2500, maxAmount: 4000 },
    { description: "Dentist visit", minAmount: 4000, maxAmount: 10000 },
    { description: "Car repair", minAmount: 8000, maxAmount: 18000 },
    { description: "Night out", minAmount: 3000, maxAmount: 7000 },
    { description: "Online shopping", minAmount: 2000, maxAmount: 5000 },
  ];

  // Heavy purchases when balance exceeds threshold
  private readonly SPLURGE_EVENTS = [
    { description: "New laptop", minAmount: 50000, maxAmount: 80000 },
    { description: "Vacation to Italy", minAmount: 60000, maxAmount: 100000 },
    { description: "New furniture", minAmount: 30000, maxAmount: 60000 },
    { description: "New phone", minAmount: 40000, maxAmount: 70000 },
    { description: "Winter coat & boots", minAmount: 20000, maxAmount: 35000 },
    { description: "City trip to Paris", minAmount: 40000, maxAmount: 70000 },
    { description: "New bicycle", minAmount: 25000, maxAmount: 45000 },
    { description: "Kitchen appliances", minAmount: 20000, maxAmount: 40000 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Creates a demo account with 1 year of transaction history
   */
  async createDemoAccount(registerDto: RegisterDto): Promise<User> {
    // Create the user account
    const user = await this.authService.register(registerDto);

    this.logger.log(`Created demo user: ${user.email}`);

    // Create demo categories
    const categoryMap = await this.createDemoCategories(user.id);

    // Generate transactions for the past year
    await this.generateYearOfTransactions(user.id, categoryMap);

    this.logger.log(`Demo account setup complete for user: ${user.email}`);

    return user;
  }

  /**
   * Creates demo categories and returns a map of category name to ID
   */
  private async createDemoCategories(
    userId: number,
  ): Promise<Map<string, number>> {
    const categoryMap = new Map<string, number>();

    for (const cat of this.DEMO_CATEGORIES) {
      const category = await this.prisma.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          userId,
        },
      });
      categoryMap.set(cat.name, category.id);
    }

    this.logger.debug(`Created ${this.DEMO_CATEGORIES.length} demo categories`);

    return categoryMap;
  }

  /**
   * Generates 1 year of transaction history
   */
  private async generateYearOfTransactions(
    userId: number,
    categoryMap: Map<string, number>,
  ): Promise<void> {
    const transactions: DemoTransaction[] = [];
    const now = DateTime.now();
    const oneYearAgo = now.minus({ years: 1 });

    // Create the recurring salary parent entry
    const salaryParent = await this.createRecurringSalary(
      userId,
      categoryMap.get("Gehalt"),
      oneYearAgo,
    );

    // Track running balance to trigger splurge purchases
    let runningBalance = 0;
    const usedSplurgeEvents = new Set<number>();

    // Generate salary child entries for each month
    for (let month = 0; month < 12; month++) {
      const salaryDate = oneYearAgo.plus({ months: month }).set({ day: 1 });

      // Only create if the date is not in the future
      if (salaryDate <= now) {
        await this.prisma.transaction.create({
          data: {
            type: TransactionType.INCOME,
            amount: this.SALARY_AMOUNT,
            description: "Gehalt",
            currency: "EUR",
            userId,
            isRecurring: false,
            categoryId: categoryMap.get("Gehalt"),
            createdAt: salaryDate.toJSDate(),
            transactionId: salaryParent.id,
          },
        });
        runningBalance += this.SALARY_AMOUNT;
      }
    }

    // Generate monthly expenses for each month
    for (let month = 0; month < 12; month++) {
      const monthStart = oneYearAgo.plus({ months: month });

      // Only generate if the month is not entirely in the future
      if (monthStart <= now) {
        const monthTransactions = this.generateMonthlyExpenses(
          monthStart,
          categoryMap,
          now,
        );

        // Calculate expenses for this month
        for (const t of monthTransactions) {
          runningBalance -= t.amount;
        }
        transactions.push(...monthTransactions);

        // Check if balance exceeds threshold - trigger a splurge purchase
        if (runningBalance > this.SPLURGE_THRESHOLD) {
          const splurgeTransaction = this.generateSplurgePurchase(
            monthStart,
            now,
            usedSplurgeEvents,
          );
          if (splurgeTransaction) {
            runningBalance -= splurgeTransaction.amount;
            transactions.push(splurgeTransaction);
          }
        }
      }
    }

    // Add random events throughout the year (more frequent now)
    const randomEventTransactions = this.generateRandomEvents(oneYearAgo, now);
    transactions.push(...randomEventTransactions);

    // Bulk insert all transactions
    await this.prisma.transaction.createMany({
      data: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        currency: "EUR",
        userId,
        isRecurring: false,
        categoryId: categoryMap.get(t.categoryName),
        createdAt: t.createdAt,
      })),
    });

    this.logger.debug(`Created ${transactions.length} demo transactions`);
  }

  /**
   * Generates a splurge purchase when balance exceeds threshold
   */
  private generateSplurgePurchase(
    monthStart: DateTime,
    now: DateTime,
    usedEvents: Set<number>,
  ): DemoTransaction | null {
    // Pick a random splurge event (avoid duplicates if possible)
    let eventIndex = this.randomInt(0, this.SPLURGE_EVENTS.length);
    if (usedEvents.size < this.SPLURGE_EVENTS.length) {
      while (usedEvents.has(eventIndex)) {
        eventIndex = this.randomInt(0, this.SPLURGE_EVENTS.length);
      }
      usedEvents.add(eventIndex);
    } else {
      // All events used, allow duplicates
      usedEvents.clear();
      usedEvents.add(eventIndex);
    }

    const event = this.SPLURGE_EVENTS[eventIndex];
    const daysInMonth = monthStart.daysInMonth ?? 28;
    const day = this.randomInt(10, Math.min(25, daysInMonth));
    const purchaseDate = monthStart.set({ day });

    if (purchaseDate <= now) {
      const amount = this.randomInt(event.minAmount, event.maxAmount);
      return {
        type: TransactionType.EXPENSE,
        amount,
        description: event.description,
        categoryName: "Freizeit",
        createdAt: purchaseDate.toJSDate(),
      };
    }

    return null;
  }

  /**
   * Creates the recurring salary parent entry
   */
  private async createRecurringSalary(
    userId: number,
    categoryId: number,
    startDate: DateTime,
  ) {
    return this.prisma.transaction.create({
      data: {
        type: TransactionType.INCOME,
        amount: this.SALARY_AMOUNT,
        description: "Gehalt",
        currency: "EUR",
        userId,
        isRecurring: true,
        categoryId,
        createdAt: startDate.set({ day: 1 }).toJSDate(),
        recurringType: RecurringTransactionType.MONTHLY,
        recurringBaseInterval: 1,
        recurringDisabled: false,
      },
    });
  }

  /**
   * Generates monthly expense transactions
   */
  private generateMonthlyExpenses(
    monthStart: DateTime,
    categoryMap: Map<string, number>,
    now: DateTime,
  ): DemoTransaction[] {
    const transactions: DemoTransaction[] = [];
    const daysInMonth = monthStart.daysInMonth ?? 28;

    // Rent - always on the 1st
    const rentDate = monthStart.set({ day: 1 });
    if (rentDate <= now) {
      transactions.push({
        type: TransactionType.EXPENSE,
        amount: this.RENT_AMOUNT,
        description: "Miete",
        categoryName: "Wohnung",
        createdAt: rentDate.toJSDate(),
      });
    }

    // Utilities - around the 5th
    const utilitiesDate = monthStart.set({ day: 5 });
    if (utilitiesDate <= now) {
      transactions.push({
        type: TransactionType.EXPENSE,
        amount: this.UTILITIES_AMOUNT,
        description: "Strom & Internet",
        categoryName: "Wohnung",
        createdAt: utilitiesDate.toJSDate(),
      });
    }

    // Insurance - around the 10th
    const insuranceDate = monthStart.set({ day: 10 });
    if (insuranceDate <= now) {
      transactions.push({
        type: TransactionType.EXPENSE,
        amount: this.INSURANCE_AMOUNT,
        description: "Versicherungen",
        categoryName: "Wohnung",
        createdAt: insuranceDate.toJSDate(),
      });
    }

    // Subscriptions - around the 15th
    const subscriptionDate = monthStart.set({ day: 15 });
    if (subscriptionDate <= now) {
      transactions.push({
        type: TransactionType.EXPENSE,
        amount: this.SUBSCRIPTIONS_AMOUNT,
        description: "Streaming & Apps",
        categoryName: "Freizeit",
        createdAt: subscriptionDate.toJSDate(),
      });
    }

    // Groceries - 4-6 times per month
    const groceryCount = this.randomInt(4, 7);
    for (let i = 0; i < groceryCount; i++) {
      const day = this.randomInt(1, daysInMonth);
      const groceryDate = monthStart.set({ day });
      if (groceryDate <= now) {
        const amount = this.randomInt(
          Math.floor(this.GROCERIES_MIN / groceryCount),
          Math.floor(this.GROCERIES_MAX / groceryCount),
        );
        transactions.push({
          type: TransactionType.EXPENSE,
          amount,
          description: this.getRandomGroceryDescription(),
          categoryName: "Lebensmittel",
          createdAt: groceryDate.toJSDate(),
        });
      }
    }

    // Transport - 2-4 times per month
    const transportCount = this.randomInt(2, 5);
    for (let i = 0; i < transportCount; i++) {
      const day = this.randomInt(1, daysInMonth);
      const transportDate = monthStart.set({ day });
      if (transportDate <= now) {
        const amount = this.randomInt(
          Math.floor(this.TRANSPORT_MIN / transportCount),
          Math.floor(this.TRANSPORT_MAX / transportCount),
        );
        transactions.push({
          type: TransactionType.EXPENSE,
          amount,
          description: this.getRandomTransportDescription(),
          categoryName: "Transport",
          createdAt: transportDate.toJSDate(),
        });
      }
    }

    // Entertainment - 3-5 times per month
    const entertainmentCount = this.randomInt(3, 6);
    for (let i = 0; i < entertainmentCount; i++) {
      const day = this.randomInt(1, daysInMonth);
      const entertainmentDate = monthStart.set({ day });
      if (entertainmentDate <= now) {
        const amount = this.randomInt(
          Math.floor(this.ENTERTAINMENT_MIN / entertainmentCount),
          Math.floor(this.ENTERTAINMENT_MAX / entertainmentCount),
        );
        transactions.push({
          type: TransactionType.EXPENSE,
          amount,
          description: this.getRandomEntertainmentDescription(),
          categoryName: "Freizeit",
          createdAt: entertainmentDate.toJSDate(),
        });
      }
    }

    return transactions;
  }

  /**
   * Generates random special event transactions throughout the year
   */
  private generateRandomEvents(
    startDate: DateTime,
    endDate: DateTime,
  ): DemoTransaction[] {
    const transactions: DemoTransaction[] = [];
    const totalDays = Math.floor(endDate.diff(startDate, "days").days);

    // Generate 8-12 random events throughout the year
    const eventCount = this.randomInt(8, 13);
    const usedEvents = new Set<number>();

    for (let i = 0; i < eventCount; i++) {
      // Pick a random event (allow duplicates after all used once)
      let eventIndex = this.randomInt(0, this.RANDOM_EVENTS.length);
      if (usedEvents.size < this.RANDOM_EVENTS.length) {
        while (usedEvents.has(eventIndex)) {
          eventIndex = this.randomInt(0, this.RANDOM_EVENTS.length);
        }
        usedEvents.add(eventIndex);
      } else {
        // All events used, allow duplicates
        usedEvents.clear();
        usedEvents.add(eventIndex);
      }

      const event = this.RANDOM_EVENTS[eventIndex];
      const randomDay = this.randomInt(0, totalDays);
      const eventDate = startDate.plus({ days: randomDay });

      if (eventDate <= endDate) {
        const amount = this.randomInt(event.minAmount, event.maxAmount);
        transactions.push({
          type: TransactionType.EXPENSE,
          amount,
          description: event.description,
          categoryName: "Freizeit",
          createdAt: eventDate.toJSDate(),
        });
      }
    }

    return transactions;
  }

  /**
   * Random integer between min (inclusive) and max (exclusive)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  private getRandomGroceryDescription(): string {
    const descriptions = [
      "Supermarkt Einkauf",
      "Wocheneinkauf",
      "REWE",
      "Edeka",
      "Lidl",
      "Aldi",
      "Bio Laden",
      "Getränkemarkt",
    ];
    return descriptions[this.randomInt(0, descriptions.length)];
  }

  private getRandomTransportDescription(): string {
    const descriptions = [
      "Tankfüllung",
      "BVG Monatsticket",
      "Uber/Taxi",
      "DB Ticket",
      "Parkgebühren",
      "Carsharing",
    ];
    return descriptions[this.randomInt(0, descriptions.length)];
  }

  private getRandomEntertainmentDescription(): string {
    const descriptions = [
      "Kino",
      "Bar/Club",
      "Café",
      "Bowling",
      "Escape Room",
      "Museum",
      "Konzert",
      "Theater",
    ];
    return descriptions[this.randomInt(0, descriptions.length)];
  }
}
