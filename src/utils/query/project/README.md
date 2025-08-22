# Project Query Utilities

This directory contains utilities for handling project-related data operations.

## Files

### `project.ts` (Client-side)

Contains functions for client-side project operations using fetch API:

- `fetchProjects()` - Fetch all projects via API
- `createProject()` - Create a new project
- `updateProject()` - Update an existing project
- `deleteProject()` - Delete a project

### `server-project.ts` (Server-side)

Contains functions for server-side project operations used in Server Components:

- `getProjects()` - Get all projects with proper data transformation
- `getCurrentUser()` - Get the current authenticated user

### `index.ts`

Barrel export file that re-exports all utilities for cleaner imports.

## Usage

### In Server Components (e.g., pages)

```typescript
import { getProjects, getCurrentUser } from "@/utils/query/project";

const projects = await getProjects();
const user = await getCurrentUser();
```

### In Client Components

```typescript
import { fetchProjects, createProject } from "@/utils/query/project";

const projects = await fetchProjects();
const newProject = await createProject({ name: "New Project" });
```

## Benefits

1. **Separation of Concerns**: Database queries are separated from page components
2. **Reusability**: Query logic can be reused across different components
3. **Type Safety**: Proper TypeScript interfaces for all data structures
4. **Error Handling**: Centralized error handling for database operations
5. **Consistency**: Standardized data transformation across the application
