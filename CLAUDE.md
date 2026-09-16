# Claude Rules

## Constants Management

### Component constants
All non-trivial inline constants used in frontend components (magic numbers, timeout durations, storage keys, color values, coordinates, etc.) must be declared in `apps/frontend/app/lib/constants.ts` and imported from there. Do not leave inline literals scattered across component files.

### API path strings
All API endpoint path strings must be declared in `apps/frontend/app/lib/apiPaths.ts` as entries of the `API_PATHS` object and imported via that file. Do not hardcode path strings (e.g. `'/errands/nearby'`) directly in component or API utility files.
