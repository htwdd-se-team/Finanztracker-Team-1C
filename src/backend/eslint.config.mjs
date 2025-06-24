// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";
import * as lintImport from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import eslintNestJs from "@darraghor/eslint-plugin-nestjs-typed";

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs", "prisma/generated/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  tseslint.configs.stylistic,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "linebreak-style": "off",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
  // eslint-plugin-import
  {
    plugins: {
      import: lintImport,
      "unused-imports": unusedImports,
    },
    files: ["**/*.ts"],
    rules: {
      "import/first": "warn",
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // npm packages
            "internal", // paths marked as internal by config
            "parent", // parent directory imports
            "sibling", // same directory imports
            "index", // index file of current directory
            "object", // object imports
            "type", // type imports
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "@/**",
              group: "external",
              position: "after",
            },
            {
              pattern: "@app/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          distinctGroup: false,
        },
      ],
      // Automatically remove unused imports
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/restrict-template-expressions": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
  eslintNestJs.configs.flatRecommended,
);
