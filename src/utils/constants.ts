export const IGNORE_LIST = [
  // Node / JavaScript
  '.git',
  '.gitignore',
  '.serverless',
  "node_modules",
  "npm-debug.log",
  "yarn-debug.log",
  "yarn-error.log",
  "pnpm-debug.log",
  "dist",
  "build",
  "coverage",
  ".npm",
  ".pnp",
  ".pnp.js",

  // TypeScript
  "*.tsbuildinfo",

  // Environment / Secrets
  ".env",
  ".env.*",
  ".DS_Store",

  // Logs
  "logs",
  "*.log",
  "debug.log",

  // OS / System
  "Thumbs.db",
  ".Trash-*",
  ".idea",
  ".vscode",

  // Testing
  ".nyc_output",

  // Cache
  ".cache",
  ".parcel-cache",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".eslintcache",
  ".stylelintcache",

  // Build tools
  ".webpack",
  ".rollup.cache",
  ".parcel-cache",

  // Misc
  "*.local",
  "*.swp",
  "*.swo",
  "*.bak"
];