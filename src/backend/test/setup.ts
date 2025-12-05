// Test setup file - sets NODE_ENV to test before any imports

process.env.NODE_ENV = "test";
if (!process.env.DATABASE_URL_TEST) {
  throw new Error("DATABASE_URL_TEST is not set");
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

// // Run Prisma migrations to ensure test database schema is up to date
// try {
//   console.log("Running Prisma migrations for test database...");

//   execSync("pnpm prisma migrate deploy", {
//     cwd: resolve(__dirname, ".."),
//     stdio: "inherit",
//     env: {
//       ...process.env,
//       DATABASE_URL: process.env.DATABASE_URL_TEST,
//     },
//   });

//   console.log("Prisma migrations completed successfully");
// } catch (error) {
//   console.error("Failed to run Prisma migrations:", error);
//   throw error;
// }
