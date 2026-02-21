#!/usr/bin/env node
import { Command } from "commander";
import { use } from "./commands/use";
import { learn } from "./commands/learn";
import { removeModule } from "./commands/remove";
import { listModules } from "./commands/list";
import { configure } from "./commands/config";
import { showLogo, showAbout } from "./utils/branding";
import { readFileSync, existsSync } from "fs";
import { getViaDataPath } from "./utils/paths";
import chalk from "chalk";

const program = new Command();

program
  .name("via")
  .description("Via — pattern-aware developer tooling")
  .version("0.1.0");

// Show branding when NO arguments are provided
if (process.argv.length <= 2) {
  showLogo();
  showAbout();
  program.help();
}

program.addHelpText('after', `
Module Usage:
  via <module_name> create <new_name>  Instantiate a learned module
`);

program.hook("preAction", (thisCommand) => {
  // Always show logo for subcommands (handled manually for empty call)
  if (thisCommand.args.length > 0) {
    showLogo();
  }
});

program
  .command("learn [path]")
  .description("Learn modules from a specific path or the whole project")
  .action((path) => {
    learn(path || "");
  });

program
  .command("list")
  .description("List all saved modules")
  .action(() => {
    listModules();
  });

program
  .command("config")
  .description("Configure AI provider and model")
  .action(() => {
    configure();
  });

program
  .command("remove <name>")
  .description("Delete a saved module")
  .action((name) => {
    removeModule(name);
  });

program
  .command("ui")
  .description("Start the Via UI documentation server")
  .option("-p, --port <number>", "Port to run the server on", "3000")
  .action(async (options) => {
    const { ui: uiCommand } = await import("./commands/ui");
    uiCommand(parseInt(options.port));
  });

// Dynamic commands from saved modules
const mappingPath = getViaDataPath('mapping.json');

if (existsSync(mappingPath)) {
  try {
    const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8'));
    Object.keys(mapping).forEach(moduleName => {
      const moduleCmd = program.command(moduleName, { hidden: true }).description(`Manage ${moduleName} module`);

      moduleCmd
        .command("create <name>")
        .description(`Instantiate ${moduleName} with a new name`)
        .action((name) => {
          use(moduleName, name);
        });
    });
  } catch (e) {
    console.error(`Warning: Failed to parse mapping.json at ${mappingPath}. Some commands may be missing.`);
  }
}

program.on('command:*', (operands) => {
  const unknownCmd = operands[0];
  const isLikelyModule = operands[1] === 'create';

  if (isLikelyModule) {
    console.error(`\n${chalk.red.bold('✖ Error:')} Module "${chalk.white.bold(unknownCmd)}" has not been learned yet.`);
    console.log(`  Use ${chalk.cyan('via learn [path]')} to teach Via about this pattern first.\n`);
  } else {
    console.error(`\n${chalk.red.bold('✖ Error:')} Unknown command "${chalk.white.bold(unknownCmd)}".`);
    console.log(`  Type ${chalk.cyan('via --help')} for available commands.\n`);
  }
  process.exit(1);
});

program.parse();
