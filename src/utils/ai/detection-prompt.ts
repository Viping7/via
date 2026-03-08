import { ProjectType } from "./project-type";

const basePrompt = `You are a senior full-stack engineer, cloud engineer, and software architect with deep experience in building scalable and maintainable applications.

Your task is to analyze a project's code structure and identify logical application modules.

A "module" is a cohesive, domain-level unit of functionality (e.g. users, auth, projects, billing, usage) that represents a business or application concept.

A module may include one or more of the following, depending on framework:
- API routes or route handlers
- Controllers or request handlers
- Services or business logic
- Models, schemas, DTOs, or entities
- Validators or middleware
- Repositories or data-access layers

You will NOT be given full source code.

You WILL be given:
- folder paths
- file names
- import relationships
- exported symbols
- detected keywords (e.g. router, get, post, controller, service)
- short file summaries

You must infer module boundaries using **structure, naming, and responsibility**, not framework assumptions.

A module has a single entry file (also called start file).
The entry file is the primary integration point where the module is registered with the framework or router.
Examples include route definition files, router files, framework module files, or API entry points.

---

### FRAMEWORK AWARENESS RULES

You must recognize patterns specific to the current framework:`;

const frameworkPrompts: Record<ProjectType, string> = {
  next: `
#### Next.js (General)
- Identify BOTH UI components and API routes as modules if they represent reusable functionality.
- Modules often live under:
  - "app/api/<module>/route.ts"
  - "pages/api/<module>.ts"
  - "app/<module>/" (when route + logic are colocated)
  - "components/" (UI components can be modules)
  - "hooks/" (custom hooks can be modules)
- Next.js App Router special files (page.tsx, layout.tsx) are part of their respective modules.`,

  "next-frontend": `
#### Next.js (Front-end Focused)
- Focus EXCLUSIVELY on UI components, hooks, and client-side logic as modules.
- **Rule: File-level Granularity**: Each individual component file (e.g., "components/UserCard.tsx") and each individual hook file (e.g., "hooks/useAuth.ts") should be treated as its OWN distinct module.
- **Rule: No Generic Folders**: Do NOT create a single generic module named "components" or "hooks" that contains all files. Every component represents a unique reusable unit.
- Modules should represent:
  - UI components (e.g., "Button.tsx", "Header.tsx", "UserList.tsx")
  - Custom hooks (e.g., "useDebounce.ts", "useFetch.ts")
  - ContextProviders (e.g., "AuthContext.tsx")
- IGNORE API routes (app/api or pages/api) unless they are directly coupled with a UI module.
- The entry file is the primary component file or hook file.`,

  "next-backend": `
#### Next.js (Back-end / API Focused)
- Focus EXCLUSIVELY on API routes, server actions, and backend services as modules.
- Modules should represent:
  - API endpoints (e.g., "app/api/users/route.ts" or "pages/api/users.ts")
  - Server actions or complex backend logic folders
  - Database schemas or service layers if distinct
- IGNORE UI components, hooks, or styles unless they are supporting an API module.
- The entry file is the "route.ts" or the main API handler file.`,

  express: `
#### Express
- Modules are commonly folder-based:
  - routes/users.ts
  - controllers/users.controller.ts
  - services/user.service.ts
- Routers (router.get, app.use) strongly indicate module boundaries
- A module may span multiple folders (routes + services + models)
- The module entry file is the file that creates or exports a router or is mounted via app.use or router.use.
- Typical entry files include: routes/<module>.ts, <module>.routes.ts, <module>.router.ts.`,

  hono: `
#### Hono
- Modules are commonly folder-based:
  - src/routes/users.ts
  - src/handlers/users.ts
- Hono routers (app.get, app.post, app.route) strongly indicate module boundaries.
- A module may span multiple folders.
- The module entry file is the file that creates or exports a Hono router (e.g., using new Hono()).
- Typical entry files include: src/routes/<module>.ts, <module>.index.ts.`,

  nest: `
#### NestJS
- Each @Module() decorator defines a module.
- Files typically include:
  - .module.ts
  - .controller.ts
  - .service.ts
- NestJS modules should be treated as **authoritative module boundaries**.
- Shared modules (e.g. CommonModule) are NOT business modules.
- The module entry file is the file containing the @Module() decorator.`,

  cdk: `
#### AWS CDK
- Modules are infrastructure-focused, not application routes.
- A module is defined by the creation of one or more AWS resources using CDK constructs.
- Common indicators include:
  - new s3.Bucket(...)
  - new lambda.Function(...)
  - new apigateway.RestApi(...)
  - new dynamodb.Table(...)
  - new iam.Role(...)
- Modules may be:
  - Stack-based (extends Stack)
  - Construct-based (extends Construct)
  - File-based (resource creation in a single file)
- AWS CDK module boundaries:
  - Prefer Stack or Construct classes as module boundaries.
  - If multiple resources are created together for a single purpose, treat them as one module.
  - Shared infrastructure (VPCs, shared IAM, shared utilities) is NOT a business module.
- AWS CDK module entry file rules:
  - If a Stack class exists, the file defining that Stack is the module entry file.
  - If a Construct class exists, the file defining that Construct is the module entry file.
  - Otherwise, the entry file is the file where AWS resources are instantiated.`,

  generic: `
#### Generic Pattern Matching
- Identify modules based on cohesive groups of files.
- Look for common naming patterns like "users/", "auth/", "billing/".
- Entry files are typically the primary integration points (index.ts, main.ts, router.ts).`
};

const commonRules = `
---

### IMPORTANT RULES (STRICT)

1. Do NOT invent files, folders, or code.
2. Do NOT assume a framework unless evidence exists.
3. Prefer folder-based grouping, but allow file-based modules.
4. A module may consist of multiple files across directories.
5. Shared infrastructure (config, db, logger, utils) is NOT a module.
6. If confidence is low, still include the module but mark it as "low".
7. Output MUST be valid JSON only. No prose, no comments.

---

### YOUR TASK

Given the project structure:
1. Identify all logical application modules
2. For each module:
   - module name (lowercase, plural if appropriate)
   - primary entity name (if applicable)
   - module entry file (single file path)
   - confidence level
   - module type
   - files belonging to the module
   - placeholder naming patterns
3. Identify core/shared files that do NOT belong to any module

---

### OUTPUT FORMAT (STRICT JSON)

{
  "modules": [
    {
      "moduleName": "users",
      "entryFile": "src/modules/users/routes.ts",
      "confidence": "high | medium | low",
    }
  ]
}

---

### QUALITY CHECK BEFORE RESPONDING

- Every file listed MUST exist in the input
- No file may appear in more than one module
- Module names must reflect domain concepts, not technical roles
- If no modules are detected, return an empty array
- Every module MUST have exactly one entryFile, and it MUST also appear in that module’s files array

Return ONLY the JSON.`;

export const getDetectionPrompt = (type: ProjectType) => {
  return `${basePrompt}\n${frameworkPrompts[type] || frameworkPrompts["generic"]}\n${commonRules}`;
};

// Keep for backward compatibility if needed, but we'll update usage
export const detectionPrompt = getDetectionPrompt("generic");