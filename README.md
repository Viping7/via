# Via

Via helps you reuse real project patterns instead of rewriting boilerplate.

It learns from your existing codebase and lets you recreate modules
without repeated AI calls or fragile templates.

> Your code is the source of truth — not scaffolds, not prompts.

## Quick start

```bash
npm install -g @via-dev/via

cd existing-project
via learn
via list
via users create accounts
```

## Why Via exists

Via was created to solve a very specific problem:

> Reusing existing code patterns should **not** require repeated AI calls.

In many workflows today, AI is used every time you:
- generate a similar module
- rename an entity
- recreate CRUD logic
- scaffold the same structure with minor changes

This leads to:
- unnecessary token usage
- repeated costs for the same logic
- unpredictable output
- reliance on AI for problems that are already solved in your codebase

### Via’s approach

Via uses AI **once**, only to *understand* your project structure.

After that:
- the learned patterns are stored locally
- generation is deterministic
- no AI calls are required
- no tokens are consumed

If a pattern already exists in your project, Via reuses it directly
instead of asking an AI model to regenerate it again.

### What this means in practice

- AI helps with **discovery**, not repetition
- Your existing code becomes the source of truth
- You don’t pay tokens for minimal changes
- You get consistent output every time
- Via works offline once learning is complete

This gives you the benefits of AI **without turning it into a runtime dependency**.

### AI is optional

If you already know the module boundaries:
- you can run `via learn <folder_path>`
- select the entry file manually
- and skip AI entirely

Via will trace dependencies and build the module deterministically.

AI is there when you need it - not when you don’t.



## Key Features

- **Pattern Learning**: Extract specific folders or components from your project and save them as reusable modules.
- **Smart Renaming**: When creating a new instance of a module, Via automatically renames files, classes, variables, and imports while preserving the original casing (PascalCase, camelCase, kebab-case, etc.) and handling plurality.
- **AI-Assisted (Optional)**: Uses AI only for pattern discovery — never for repeated generation.
- **Web UI**: A built-in documentation server to browse and manage your saved modules.


## Language support

Via currently supports **TypeScript-based projects and modules only**.

This allows Via to:
- understand imports and dependencies accurately
- perform safe, context-aware renaming
- validate generated code deterministically

Support for other languages or plain JavaScript may be explored in the future.

## Supported Technologies

Currently, Via is optimized for backend patterns in the following ecosystems:

- **Express.js**
- **Hono.js**
- **NestJS**
- **Next.js** (Beta - API routes and backend logic)


## AI support (optional, transparent, and secure)

Via can use AI to detect modules and patterns from large or complex codebases.
AI is **optional** and used only during the learning phase.

### Supported AI providers

Via supports multiple providers out of the box:

- **OpenAI** (GPT models)
- **Anthropic** (Claude models)
- **Google** (Gemini)
- **Ollama** (locally running open-source models)

This can be selected or modified using `via config` command.

### What data is sent to AI

When AI is enabled, **Via sends only project metadata**, never your source code.

This includes:
- folder paths
- file names
- file relationships and imports
- detected symbols and keywords
- structural summaries

❌ **Your actual code is never sent to any AI provider.**

This design ensures:
- code privacy
- security for private repositories
- safe usage in enterprise environments

### When AI is used

- AI is used **only during `via learn`** and only if a path is not provided
- AI helps detect:
  - logical modules
  - entry files
  - structural boundaries
- AI is **not used** during:
  - module generation
  - listing modules
  - removing modules

All generation after learning is **deterministic and offline-friendly**.

### No lock-in, predictable costs

- You choose the AI provider and model
- No background AI calls
- No surprise token usage
- Once learning is complete, Via works without AI

This gives you the benefits of AI-assisted understanding
without runtime dependency or exposing your code.

### Local models with Ollama

Via also supports locally running models via **Ollama**.
This is ideal for:
- offline environments
- highly sensitive codebases
- zero API cost workflows

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

### 5. Remove a Module
Delete a saved module

```bash
# General syntax: via <module_name> create <new_name>
via remove <name>
```

### 5. Configure AI Provider

Configure the AI provider if in AI mode (`via learn` without path)

```bash
# General syntax: via <module_name> create <new_name>
via config
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
