// Type declaration for multer in e2e tests
// Multer is available at runtime via pnpm, we just need TypeScript to recognize it
declare module "multer" {
  export function memoryStorage(): any;
  export type FileFilterCallback = (
    error: Error | null,
    acceptFile?: boolean,
  ) => void;
}
