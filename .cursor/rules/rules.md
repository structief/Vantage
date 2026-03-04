# Commands

- `npm run build`: Build the project
- `npm run test`: Run UI tests and coverage (prefer single test files for speed)
- `npm run test:e2e`: Run end-to-end tests

# Code style

- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible: `import { foo } from 'bar'`

# Workflow

- Always typecheck after making a series of code changes
- API routes go in `app/api/` following existing patterns
- Update the status of to-do tasks as you go, not at the end
- Run the project in dev-mode and *always* run tests when you're done implementing