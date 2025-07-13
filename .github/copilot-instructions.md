# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `yarn dev` - Start both frontend and backend in development mode
- `yarn start` - Start frontend only
- `yarn start-backend` - Start backend only
- `yarn docker-deps` - Start PostgreSQL and Redis via Docker Compose

### Build & Test

- `yarn build:all` - Build all packages and plugins
- `yarn test:all` - Run all tests with coverage (Backstage CLI)
- `yarn test:jest` - Run Jest tests on plugins/ with coverage thresholds
- `yarn test:e2e` - Run Playwright end-to-end tests
- `yarn jest` - Run Jest unit tests (no coverage)
- `yarn tsc:full` - Full TypeScript compilation check

### Code Quality

- `yarn lint` - Lint changes since origin/main
- `yarn lint:all` - Lint entire codebase
- `yarn lint:fix` - Auto-fix linting issues and format code
- `yarn check` - Full validation (prettier, tsc, lint, test, dedupe)

### Code Generation

- `yarn generate` - Generate OpenAPI client/server code for Renovate plugin

## Architecture

This is a **Backstage plugins monorepo** using Yarn workspaces with two main workspace areas:

- `packages/` - Core Backstage app (frontend + backend)
- `plugins/` - Custom Backstage plugins

### Plugin Architecture

**Renovate Plugin Suite** (primary plugin system):

- `renovate/` - Frontend UI components and pages
- `renovate-backend/` - Backend API endpoints and services
- `renovate-client/` - Auto-generated API client library
- `renovate-common/` - Shared types and utilities
- `renovate-node/` - Node.js specific components
- Backend modules for different implementations:
  - `renovate-backend-module-queue-local/` - Local job queue
  - `renovate-backend-module-queue-redis/` - Redis job queue
  - `renovate-backend-module-runtime-*` - Different execution environments (direct, Docker, S3)

**Scaffolder Backend Module**:

- `scaffolder-backend-module-filter-utilities/` - JSONata filtering utilities

### Database & Services

- **PostgreSQL 17** on port 5432 (via Docker Compose)
- **Redis 8** on port 6379 (via Docker Compose)
- Database migrations in `plugins/renovate-backend/migrations/`
- Environment variables loaded from `packages/backend/.env`

### Code Generation

The Renovate backend uses OpenAPI code generation:

- Schema: `plugins/renovate-backend/src/schema/openapi.yaml`
- Generates both client and server code automatically
- Run `yarn generate` after schema changes

### Key Technologies

- **Backstage**:
- **Node.js**: 20 || 22
- **Testing**: Jest + Playwright
- **Database**: Knex.js with PostgreSQL
- **Package Manager**: Yarn 4.9.2

### Plugin Development Patterns

- All plugins use `@secustor/backstage-plugin-` naming convention
- Follow Backstage's new backend system with modules and extension points
- Use generated TypeScript clients for API communication
- Database operations through Knex migrations and models

## Testing Best Practices

### Mocking Strategy Guidelines

When writing Jest tests, follow this priority order for creating mocks:

#### 1. Backstage Services (Highest Priority)

For services from `@backstage/backend-plugin-api`, **always use the official Backstage test utilities first**:

```typescript
import { mockServices } from '@backstage/backend-test-utils';

// Backstage service mocks - USE THESE FIRST
const mockLogger = mockServices.logger.mock();
const mockCache = mockServices.cache.mock();
const mockDatabase = mockServices.database.mock();
const mockAuth = mockServices.auth.mock();
const mockScheduler = mockServices.scheduler.mock();
const mockConfig = mockServices.rootConfig();
```

**Available mockServices:**

- `mockServices.logger.mock()` - LoggerService
- `mockServices.cache.mock()` - CacheService
- `mockServices.database.mock()` - DatabaseService
- `mockServices.auth.mock()` - AuthService
- `mockServices.scheduler.mock()` - SchedulerService
- `mockServices.rootConfig()` - Config
- `mockServices.discovery.mock()` - DiscoveryService
- And many more...

#### 2. Non-Backstage Interfaces (Secondary)

For TypeScript interfaces that are NOT Backstage services, use `jest-mock-extended`:

```typescript
import { mockDeep } from 'jest-mock-extended';
import type { CatalogClient } from '@backstage/catalog-client';
import type { CustomService } from './types';

// External libraries and custom interfaces
const mockCatalogClient = mockDeep<CatalogClient>();
const mockCustomService = mockDeep<CustomService>();
```

#### 3. Decision Tree

```
Is it a service from @backstage/backend-plugin-api?
├─ YES → Use mockServices from @backstage/backend-test-utils
└─ NO → Is it a TypeScript interface?
   ├─ YES → Use mockDeep from jest-mock-extended
   └─ NO → Use manual Jest mocking (jest.fn(), etc.)
```

### Benefits of This Approach

**mockServices advantages:**

- Official Backstage testing utilities
- Battle-tested and maintained by Backstage team
- Consistent with Backstage ecosystem
- Automatic updates with Backstage releases

**mockDeep advantages:**

- Full type safety with TypeScript interfaces
- Automatic generation of all interface methods as Jest mocks
- No need to manually implement every method
- Better IntelliSense support compared to manual mocking

**Both eliminate:**

- Manual mock object creation
- `as any` type casting
- Incomplete interface implementations

### Coverage Reporting

Jest test coverage is automatically generated when running test commands. The Jest configuration uses multiple coverage reporters: `["json", "json-summary", "html", "text-summary"]`.

**Current Project Coverage Status:**

- **Lines**: 54.28% (2,412/4,443)
- **Statements**: 53.97% (2,527/4,682)
- **Functions**: 31.46% (270/858)
- **Branches**: 28.69% (615/2,143)

**Coverage Target: 80% (Long-term)** - Current thresholds set to achievable levels (branches: 30%, functions: 35%, lines: 55%, statements: 55%). Gradually increase these thresholds as coverage improves.

**Coverage File Formats:**

1. **`coverage/coverage-summary.json`** - Aggregated metrics summary
   - Contains total project coverage percentages for lines, statements, functions, and branches
   - Includes per-file summary without detailed execution maps
   - Ideal for quick coverage overview and CI/CD reporting
   - Example: `{"total": {"lines":{"total":4443,"covered":2412,"pct":54.28}}}`

2. **`coverage/coverage-final.json`** - Detailed coverage data
   - Contains comprehensive per-file coverage with execution maps
   - Includes statement maps, function maps, branch maps, and line-by-line execution counts
   - Used for detailed analysis and coverage visualization tools
   - Larger file size due to complete execution tracking data

**Accessing Coverage Data:**

```bash
# Run tests with coverage (generates all formats)
yarn test:jest

# View coverage summary in terminal (automatically displayed)
# Open detailed HTML report for visual analysis
open coverage/lcov-report/index.html

# Parse different coverage formats programmatically
cat coverage/coverage-summary.json | jq '.total.lines.pct'          # Quick percentage
cat coverage/coverage-final.json | jq '.total'                      # Detailed totals

# Check if coverage meets 80% target
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE >= 80" | bc -l) )); then echo "✅ Coverage target met"; else echo "❌ Coverage below 80%"; fi
```

**Coverage Analysis:**

- **Priority**: Focus on improving function coverage (currently 31%) and branch coverage (currently 29%)
- **Files needing attention**: Many backend and plugin files have 0% coverage
- **Well-covered areas**: Some common utilities and data processing modules show good coverage

### Table-Driven Testing with `it.each`

For functions with predictable input/output patterns, especially string transformations and validations, use `it.each` to create table-driven tests that reduce duplication and improve maintainability.

#### When to Use `it.each`

Use table-driven testing for:

- String formatting and transformation functions
- Validation functions that return different error messages
- Functions that return status/state strings based on conditions
- Simple conditional logic with string outputs
- Any function where you'd write multiple similar test cases

#### Benefits

- **Reduces code duplication** - One test structure for multiple scenarios
- **Improves readability** - Clear input/output mapping in tabular format
- **Easy to extend** - Add new test cases by adding table rows
- **Better test names** - Automatic descriptive test names from parameters

#### Examples

**String Validation with Different Messages:**

```typescript
describe('validateEmail', () => {
  it.each`
    email                    | expectedError
    ${'valid@example.com'}   | ${null}
    ${'missing-at-sign.com'} | ${'Email must contain @ symbol'}
    ${'@no-local-part.com'}  | ${'Email must have local part'}
    ${'no-domain@.com'}      | ${'Email must have valid domain'}
    ${''}                    | ${'Email is required'}
  `(
    'should validate email "$email" and return $expectedError',
    ({ email, expectedError }) => {
      const result = validateEmail(email);
      expect(result).toBe(expectedError);
    },
  );
});
```

**String Formatting Function:**

```typescript
describe('formatUserRole', () => {
  it.each`
    input          | expected
    ${'admin'}     | ${'Administrator'}
    ${'user'}      | ${'Standard User'}
    ${'guest'}     | ${'Guest User'}
    ${'moderator'} | ${'Content Moderator'}
    ${''}          | ${'Unknown Role'}
    ${null}        | ${'Unknown Role'}
  `('should format role "$input" as "$expected"', ({ input, expected }) => {
    expect(formatUserRole(input)).toBe(expected);
  });
});
```

#### Best Practices

- Keep test data simple and focused on the function's core logic
- Use descriptive parameter names in test descriptions
- Group related test cases in the same table
- Consider splitting complex scenarios into separate `it.each` blocks
- Ensure each test case is independent and doesn't rely on execution order

### Object Assertion Best Practices

**Use `toMatchObject` for complex object validation instead of individual property assertions.**

#### Preferred Pattern - `toMatchObject`

```typescript
it('should validate build system presence', () => {
  expect(buildToolCheck).toMatchObject({
    id: 'buildToolCheck',
    name: 'Build system check',
    factIds: expect.arrayContaining(['githubRepoServiceFactRetriever']),
    rule: {
      conditions: {
        all: [
          {
            fact: 'buildSystem',
            operator: 'equal',
            value: true,
          },
        ],
      },
    },
  });
});
```

### Array Testing Best Practices

**Use `toHaveLength` and `toMatchObject` for comprehensive array validation.**

#### Preferred Pattern - Length + Structure Validation

```typescript
it('should parse vision data correctly', () => {
  const result: VisionData[] = VisionJsonSchema.parse(validData);

  // First verify the array length
  expect(result).toHaveLength(2);

  // Then validate the structure and content
  expect(result).toMatchObject([
    {
      serviceQualityIndicator: {
        staticAnalysisResult: null,
      },
    },
    {
      serviceQualityIndicator: {
        staticAnalysisResult: {
          passed: true,
        },
      },
    },
  ]);
});
```

#### Benefits of This Approach

- **Clear length validation** - `toHaveLength` provides explicit array size verification
- **Structure validation** - `toMatchObject` validates array contents and nested properties
- **Better error messages** - Clear indication whether length or structure is wrong
- **Partial matching** - Only specify properties you care about in each array element
- **Type safety** - Works well with TypeScript interfaces and schemas

#### When to Use `toHaveLength`

- **Array results from parsers or validators** - Verify expected number of items parsed
- **Function returns that should have specific counts** - Database queries, filtered results
- **Test data setup verification** - Ensure test fixtures have expected sizes
- **API response validation** - Verify expected number of items returned

#### Benefits of `toMatchObject`

- **Cleaner syntax** - Single assertion vs multiple assertions
- **Partial matching** - Only specify properties you care about
- **Better failure messages** - Shows clear diff of expected vs actual
- **Nested object support** - Validates deep object structure naturally
- **Array flexibility** - Use `expect.arrayContaining()` for flexible array validation
- **Type safety** - Avoids `as any` type casting

#### When to Use Each Approach

- **Use `toMatchObject`**: Complex objects, configuration validation, API responses, nested structures
- **Use individual assertions**: Simple values, when you need specific error messages, testing single properties

### Testing Restrictions

#### Module Index Files - Do Not Test

**Do not attempt to test `index.ts` files of backend modules and plugin modules.** These files typically contain:

- `createBackendModule()` calls that create complex Backstage backend features
- Plugin registration and initialization logic
- Extension point configurations
- Complex dependency injection setups

**Examples of files to avoid testing:**

- `plugins/renovate-backend/src/index.ts`
- Any `index.ts` file that exports `createBackendModule()` or similar factory functions

**Why these are problematic to test:**

- They return `BackendFeature` objects with complex internal structure
- They have no direct functionality beyond registration/configuration
- They require extensive mocking of Backstage's internal systems
- The ROI for testing these files is extremely low
- They often cause more test maintenance burden than value

**Instead, focus testing efforts on:**

- Individual processor classes and their methods
- Utility functions and helper methods
- Service implementations and business logic
- Data transformation and validation functions
- Individual check implementations (like the files in `./checks/` directories)
