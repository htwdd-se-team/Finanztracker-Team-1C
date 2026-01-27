# API Client Package Refactor Plan

## Overview
This plan outlines the steps to extract the generated API client code from the frontend package into a dedicated pnpm workspace package called `api-client`. This will improve code organization, enable reusability across multiple packages, and separate concerns.

## Current State Analysis

### Current Structure
- **Location**: `src/frontend/__generated__/api.ts` (1554 lines)
- **Generation Script**: `src/frontend/buildApiClient.ts`
- **Usage**: Imported in 18+ files across the frontend using `@/__generated__/api`
- **Dependencies**: 
  - `swagger-typescript-api` (dev dependency)
  - `axios` (runtime dependency)
  - `dotenv` (for build script)

### Current Import Pattern
```typescript
import { Api } from "@/__generated__/api"
import { ApiLoginDto, ApiTransactionType, ... } from '@/__generated__/api'
```

## Target State

### New Structure
```
src/
├── api-client/                    # New package
│   ├── package.json              # Package configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── generate.ts               # API generation script (moved from frontend)
│   ├── index.ts                  # Main export file
│   └── __generated__/            # Generated API code
│       └── api.ts                # Generated types and API class
├── frontend/
│   └── api/
│       └── api-client.ts         # Updated to import from api-client package
└── backend/
```

### New Import Pattern
```typescript
import { Api, ApiLoginDto, ApiTransactionType, ... } from 'api-client'
```

## Implementation Steps

### 1. Create API Client Package Structure

**Directory**: `src/api-client/`

**Files to create**:
- `package.json` - Package manifest
- `tsconfig.json` - TypeScript configuration
- `generate.ts` - API generation script
- `index.ts` - Main export file
- `.gitignore` - Ignore generated files

### 2. Package Configuration

**`package.json`**:
```json
{
  "name": "api-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "generate": "tsx generate.ts",
    "clean": "rm -rf __generated__"
  },
  "dependencies": {
    "axios": "^1.10.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "dotenv": "^16.5.0",
    "swagger-typescript-api": "^13.2.4",
    "tsx": "^4.20.3",
    "typescript": "^5.7.3"
  }
}
```

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Generation Script

**`generate.ts`** (adapted from `buildApiClient.ts`):
```typescript
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import * as dotenv from 'dotenv'
import { generateApi } from 'swagger-typescript-api'

const filePath = path.resolve(process.cwd(), '__generated__')
dotenv.config({ path: '../frontend/.env.local' })

const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3111'}/api-json`

const main = async () => {
    if (existsSync(filePath)) {
        rmSync(filePath, { recursive: true })
    }
        
    await generateApi({
        fileName: 'api.ts',
        output: filePath,
        url: apiUrl,
        extractEnums: true,
        httpClientType: 'axios',
        typePrefix: 'Api',
        apiClassName: 'Api',
    })
    
    console.log('✅ API client generated successfully')
}

main()
```

### 4. Main Export File

**`index.ts`**:
```typescript
// Re-export everything from the generated API
export * from './__generated__/api'
```

### 5. Update Frontend Package

**Add workspace dependency to `src/frontend/package.json`**:
```json
{
  "dependencies": {
    "api-client": "workspace:*",
    // ... other dependencies
  }
}
```

**Remove from `src/frontend/package.json`**:
- Script: `"build:api": "tsx buildApiClient.ts"`
- Dev dependencies: `swagger-typescript-api` (if not used elsewhere)

### 6. Update Imports

**Files to update** (18 files total):
1. `src/frontend/api/api-client.ts` - Change `@/__generated__/api` to `api-client`
2. `src/frontend/components/TransactionDialog.tsx`
3. `src/frontend/components/table-filters.tsx`
4. `src/frontend/components/settings/filter-management.tsx`
5. `src/frontend/components/provider/user-provider.tsx`
6. `src/frontend/components/provider/category-provider.tsx`
7. `src/frontend/components/filter-dialog.tsx`
8. `src/frontend/components/entry-list.tsx`
9. `src/frontend/components/dashboard/tiles/pie-chart-icons-tile.tsx`
10. `src/frontend/components/dashboard/tiles/history-tile.tsx`
11. `src/frontend/components/dashboard/tiles/delta-tile.tsx`
12. `src/frontend/components/create-category-dialog.tsx`
13. `src/frontend/components/category-select.tsx`
14. `src/frontend/app/table/page.tsx`
15. `src/frontend/app/register/page.tsx`
16. `src/frontend/app/overview/page.tsx`
17. `src/frontend/app/login/page.tsx`

**Find and replace**:
- `from '@/__generated__/api'` → `from 'api-client'`
- `from "@/__generated__/api"` → `from 'api-client'`

### 7. Cleanup

**Remove from frontend**:
- `src/frontend/__generated__/` directory
- `src/frontend/buildApiClient.ts` file

## Benefits

1. **Separation of Concerns**: API client generation is isolated from frontend code
2. **Reusability**: Other packages (tests, backend utilities) can import the API client
3. **Cleaner Frontend**: Removes generated code from frontend package
4. **Better Organization**: Clear ownership of API client generation
5. **Independent Versioning**: API client can be versioned separately
6. **Simplified Imports**: Cleaner import statements (`api-client` vs `@/__generated__/api`)

## Usage After Refactor

### Generate API Client
```bash
# From root
pnpm --filter api-client generate

# Or from api-client directory
cd src/api-client
pnpm generate
```

### Import in Frontend
```typescript
import { Api, ApiLoginDto, ApiTransactionType } from 'api-client'
```

### Add to Root Scripts (Optional)
Add to root `package.json`:
```json
{
  "scripts": {
    "generate:api": "pnpm --filter api-client generate"
  }
}
```

## Migration Checklist

- [ ] Create `src/api-client` directory structure
- [ ] Create `package.json` with dependencies
- [ ] Create `tsconfig.json`
- [ ] Create `generate.ts` script
- [ ] Create `index.ts` export file
- [ ] Create `.gitignore` for api-client
- [ ] Copy `__generated__/api.ts` to new location
- [ ] Add api-client as dependency to frontend
- [ ] Update all 18 import statements in frontend
- [ ] Remove `buildApiClient.ts` from frontend
- [ ] Remove `build:api` script from frontend package.json
- [ ] Remove old `__generated__` directory from frontend
- [ ] Test API generation in new package
- [ ] Test frontend builds successfully
- [ ] Update documentation/README if needed

## Potential Issues & Solutions

### Issue: Path resolution in generate.ts
**Solution**: Use relative paths or environment variables to locate backend URL

### Issue: Frontend can't find api-client package
**Solution**: Run `pnpm install` at root to link workspace packages

### Issue: TypeScript errors after migration
**Solution**: Ensure tsconfig.json in api-client is properly configured and frontend can resolve the package

### Issue: Generated files not ignored by git
**Solution**: Add `__generated__/` to `.gitignore` in api-client package

## Testing Strategy

1. **Generate API Client**: Run generation script and verify output
2. **Build Frontend**: Ensure frontend builds without errors
3. **Runtime Testing**: Test API calls in development mode
4. **Import Resolution**: Verify all imports resolve correctly
5. **Type Checking**: Run TypeScript compiler to check for type errors

## Timeline

This refactor can be completed in a single session:
1. Package setup and configuration
2. Move and adapt generation script
3. Update all imports
4. Cleanup old files
5. Testing and verification

## Notes

- The generated `api.ts` file should remain in `__generated__/` within the api-client package
- The api-client package is marked as `private: true` since it's internal to the monorepo
- Consider adding the generated files to `.gitignore` if they should be generated on-demand
- The package uses `"type": "module"` for ESM support
