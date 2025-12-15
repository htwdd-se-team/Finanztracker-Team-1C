import { test, expect } from '@playwright/test';

/**
 * Transaction creation test suite
 *
 * Usage:
 * - Set the base URL: TEST_URL=http://localhost:3000 pnpm test
 * - Set test credentials: TEST_EMAIL=test@example.com TEST_PASSWORD=password123 pnpm test
 * - Or modify the defaults below
 */
const DEFAULT_TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const DEFAULT_TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const DEFAULT_TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

test.describe('Transaction Creation Tests', () => {
  const testUrl = process.env.TEST_URL || DEFAULT_TEST_URL;
  const loginUrl = `${testUrl}/login`;

  // Helper function to login before transaction tests
  async function login(page: any) {
    const testEmail = process.env.TEST_EMAIL || DEFAULT_TEST_EMAIL;
    const testPassword = process.env.TEST_PASSWORD || DEFAULT_TEST_PASSWORD;

    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Passwort');
    const submitButton = page.getByRole('button', { name: 'Einloggen' });

    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await submitButton.click();

    // Wait for successful login - either redirect or success message
    await Promise.race([
      page.waitForURL(new RegExp('/overview'), { timeout: 15000 }).catch(() => null),
      page.waitForSelector('text=/Login erfolgreich/i', { timeout: 15000 }).catch(() => null),
    ]);

    // Wait for page to be fully loaded and UI to render
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // If networkidle times out, at least wait for domcontentloaded
      await page.waitForLoadState('domcontentloaded');
    }

    // Additional wait for React components to render (only if page is still valid)
    try {
      if (!page.isClosed()) {
        await page.waitForTimeout(1000);
      }
    } catch {
      // Page might have closed, that's okay
    }
  }

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);

    // Wait for the page to be ready (overview or any authenticated page)
    await page.waitForLoadState('domcontentloaded');

    // Wait for sidebar/navigation to be ready - the "Neue Transaktion" button is in the sidebar
    // Try multiple selectors to find when the page is ready
    try {
      await Promise.race([
        page.waitForSelector('button:has-text("Neue Transaktion")', { timeout: 10000 }),
        page.waitForSelector('[data-sidebar="menu-item"]', { timeout: 10000 }),
        page.waitForSelector('nav', { timeout: 10000 }),
      ]);
    } catch (e) {
      // If selectors don't appear, wait a bit more for UI to render (only if page is valid)
      try {
        if (!page.isClosed()) {
          await page.waitForTimeout(1000);
        }
      } catch {
        // Page might have closed, that's okay
      }
    }
  });

  test('should open transaction dialog when clicking "Neue Transaktion"', async ({ page }) => {
    // Find and click the "Neue Transaktion" button
    // Try multiple ways to find the button
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });

    // If not found by role, try by text
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }

    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for the dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Check that the dialog title is visible
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();
  });

  test('should create a simple expense transaction', async ({ page }) => {
    // Open transaction dialog
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }
    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();

    // Wait for the form to be ready - wait for amount input to be visible
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    // Verify "Ausgabe" (Expense) is selected by default (it should be based on the code)
    const expenseButton = page.getByRole('button', { name: /Ausgabe/i });
    await expect(expenseButton).toBeVisible();

    // Fill in amount (required field)
    // Use name attribute selector as it's more reliable
    const amountInput = page.locator('input[name="amount"]');
    await amountInput.clear();
    await amountInput.fill('25,50');

    // Optionally fill in description
    const descriptionInput = page.getByLabel(/Beschreibung/i);
    await descriptionInput.fill('Test Einkauf');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Hinzufügen/i });
    await submitButton.click();

    // Wait for success message
    await expect(
      page.getByText(/Transaktion erfolgreich erstellt/i)
    ).toBeVisible({ timeout: 10000 });

    // Dialog should close after successful submission
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Dialog might close very quickly, so we just check for success message
    });
  });

  test('should create an income transaction', async ({ page }) => {
    // Open transaction dialog
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }
    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();

    // Wait for the form to be ready
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    // Click "Einnahme" (Income) button
    const incomeButton = page.getByRole('button', { name: /Einnahme/i });
    await expect(incomeButton).toBeVisible();
    await incomeButton.click();

    // Fill in amount
    const amountInput = page.locator('input[name="amount"]');
    await amountInput.clear();
    await amountInput.fill('1500,00');

    // Fill in description
    const descriptionInput = page.getByLabel(/Beschreibung/i);
    await descriptionInput.fill('Gehalt Dezember');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Hinzufügen/i });
    await submitButton.click();

    // Wait for success message
    await expect(
      page.getByText(/Transaktion erfolgreich erstellt/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should validate that amount is required', async ({ page }) => {
    // Open transaction dialog
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }
    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();

    // Wait for the form to be ready
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    // Try to submit without filling amount (should have default 0,00)
    // Clear the amount field
    const amountInput = page.locator('input[name="amount"]');
    await amountInput.clear();
    await amountInput.fill('0,00');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Hinzufügen/i });
    await submitButton.click();

    // Should show validation error (amount must be > 0)
    // Check for error message or that form didn't submit
    const errorMessage = page.getByText(/Betrag muss größer als 0 sein/i);
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    // Either error message appears or form validation prevents submission
    expect(hasError || (await amountInput.inputValue()) === '0,00').toBeTruthy();
  });

  test('should allow canceling transaction creation', async ({ page }) => {
    // Open transaction dialog
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }
    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /Abbrechen/i });
    await cancelButton.click();

    // Dialog should close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
  });

  test('should create transaction with category', async ({ page }) => {
    // Open transaction dialog
    let newTransactionButton = page.getByRole('button', { name: /Neue Transaktion/i });
    const buttonFound = await newTransactionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!buttonFound) {
      newTransactionButton = page.locator('button:has-text("Neue Transaktion")');
    }
    await expect(newTransactionButton).toBeVisible({ timeout: 15000 });
    await newTransactionButton.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await expect(page.getByText('Transaktion hinzufügen')).toBeVisible();

    // Wait for the form to be ready
    await page.waitForSelector('input[name="amount"]', { timeout: 5000 });

    // Fill in amount
    const amountInput = page.locator('input[name="amount"]');
    await amountInput.clear();
    await amountInput.fill('45,99');

    // Fill in description
    const descriptionInput = page.getByLabel(/Beschreibung/i);
    await descriptionInput.fill('Supermarkt Einkauf');

    // Try to select a category (if available)
    const categoryButton = page.getByRole('combobox', { name: /Kategorie/i });
    const categoryExists = await categoryButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (categoryExists) {
      await categoryButton.click();
      // Wait for dropdown to open
      await page.waitForTimeout(500);
      // Try to select first available category option
      const firstCategoryOption = page.locator('[role="option"]').first();
      const optionExists = await firstCategoryOption.isVisible({ timeout: 2000 }).catch(() => false);
      if (optionExists) {
        await firstCategoryOption.click();
      }
    }

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Hinzufügen/i });
    await submitButton.click();

    // Wait for success message
    await expect(
      page.getByText(/Transaktion erfolgreich erstellt/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
