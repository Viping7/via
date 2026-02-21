# Via

**Via** is a pattern-aware developer toolkit that helps you capture and reuse code patterns in your project. It "learns" from your existing codebase and allows you to instantiate those patterns (modules) with intelligent, context-aware renaming.

## Key Features

- **Pattern Learning**: Extract specific folders or components from your project and save them as reusable modules.
- **Smart Renaming**: When creating a new instance of a module, Via automatically renames files, classes, variables, and imports while preserving the original casing (PascalCase, camelCase, kebab-case, etc.) and handling plurality.
- **AI-Powered (Optional)**: Can lean on AI for complex pattern recognition and documentation.
- **Web UI**: A built-in documentation server to browse and manage your saved modules.

## Supported Technologies

Currently, Via is optimized for backend patterns in the following ecosystems:

- **Express.js**
- **Hono.js**
- **NestJS**
- **Next.js** (API routes and backend logic)

## Installation

To install Via globally:

```bash
npm install -g via
```

## Usage

### 1. Learn a Module
Point Via to a folder containing a pattern you want to reuse (e.g., a Controller, a Service, or a CDK Stack). If you omit the path, Via enters **AI mode** to automatically detect patterns across your entire project.

```bash
# Learn from a specific path
via learn src/controllers/user

# Auto-detect patterns using AI
via learn
```

### 2. List Saved Modules
See everything Via has learned so far.

```bash
via list
```

### 3. Instantiate a Module
Create a new instance of a learned module with a new name. Via will intelligently rename everything for you.

```bash
# General syntax: via <module_name> create <new_name>
via UserControllerModule create Auth
```

### 4. Open the Web UI
Explore your learned modules in a beautiful web interface.

```bash
via ui
```

## Command Reference

| Command | Description |
| :--- | :--- |
| `via learn [path]` | Learn from a path, or auto-detect modules using AI if path is omitted |
| `via list` | List all saved modules |
| `via <module> create <name>` | Instantiate a learned module with a new name |
| `via remove <name>` | Delete a saved module |
| `via ui` | Start the Via UI documentation server |
| `via config` | Configure AI provider and model |

## Smart Renaming in Action

Via isn't just a search-and-replace tool. It understands your code's context:

- **PascalCase**: `UserComponent` becomes `AccountPage`
- **camelCase**: `userService` becomes `authService`
- **kebab-case**: `user-module.ts` becomes `auth-module.ts`
- **UPPERCASE**: `USER_ID` becomes `AUTH_ID`
- **Plurality**: `users` becomes `accounts`

## License

MIT © viping7
