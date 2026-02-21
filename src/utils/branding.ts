import figlet from "figlet";
import chalk from "chalk";
import gradient from "gradient-string";

const viaGradient = gradient(["#9621A1", "#C13C62", "#B6353B"]);

export const showLogo = () => {
    const text = figlet.textSync("VIA", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
    });
    console.log(viaGradient.multiline(text));
};

export const showAbout = () => {
    console.log(`${chalk.bold(viaGradient("Via — pattern-aware developer tooling"))}\n`);

    console.log(`${chalk.white("Via helps you reuse real project patterns instead of rewriting boilerplate.")}`);
    console.log(`${chalk.white("Most scaffolding tools start from templates.")}`);
    console.log(`${chalk.white("Via starts from ")}${chalk.bold.cyan("YOUR")}${chalk.white(" code.")}\n`);

    console.log(`${chalk.white("It learns how your projects are structured — modules, routes, services,")}`);
    console.log(`${chalk.white("infrastructure, and patterns — and lets you reuse them consistently")}`);
    console.log(`${chalk.white("across new projects and features.")}\n`);

    console.log(chalk.cyan.bold("To use a learned module:"));
    console.log(`${chalk.white("  via <module_name> create <new_name>")}\n`);

    console.log(chalk.cyan.bold("Why Via exists:"));
    console.log(`${chalk.gray("  •")} Copy-pasting modules across projects is slow and error-prone`);
    console.log(`${chalk.gray("  •")} Boilerplates don’t match real-world codebases`);
    console.log(`${chalk.gray("  •")} Every team has its own patterns — Via adapts to them\n`);

    console.log(chalk.cyan.bold("What Via does:"));
    console.log(`${chalk.gray("  •")} Learns modules from an existing project`);
    console.log(`${chalk.gray("  •")} Understands entry files, structure, and conventions`);
    console.log(`${chalk.gray("  •")} Generates new modules that match your codebase`);
    console.log(`${chalk.gray("  •")} Works with Next.js, Express, Hono, NestJS, and AWS CDK\n`);

    console.log(chalk.cyan.bold("How module learning works:"));
    console.log(`${chalk.gray("  •")} To detect modules across an entire codebase, Via uses AI`);
    console.log(`${chalk.gray("  •")} For precise control, you can skip AI and learn a module manually`);
    console.log(`${chalk.gray("  •")} Run ${chalk.white.bold("via learn <folder_path>")}`);
    console.log(`${chalk.gray("  •")} Select the module entry file`);
    console.log(`${chalk.gray("  •")} Via traces all dependencies and builds the module graph automatically\n`);

    console.log(chalk.cyan.bold("How Via uses AI (important):"));
    console.log(`${chalk.gray("  •")} You choose the AI provider from a predefined list`);
    console.log(`${chalk.gray("  •")} AI is used ONLY during ${chalk.white.bold("via learn")}`);
    console.log(`${chalk.gray("  •")} No AI calls during generate, list, or remove`);
    console.log(`${chalk.gray("  •")} This gives you:`);
    console.log(`${chalk.gray("    -")} predictable output`);
    console.log(`${chalk.gray("    -")} no surprise token usage`);
    console.log(`${chalk.gray("    -")} offline-friendly generation`);
    console.log(`${chalk.gray("    -")} the benefits of AI without runtime dependency\n`);
};

export const showWelcomeMessage = (message: string) => {
    console.log(viaGradient(message));
    console.log("\n");
};

export const showStatusLoader = () => {
    const messages = [
        "Finding common patterns...",
        "Going through bytes...",
        "Analyzing project structure...",
        "Resolving dependencies...",
        "Detecting modules...",
    ];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${viaGradient(messages[i % messages.length])}`);
        i++;
    }, 1500);

    return {
        stop: () => {
            clearInterval(interval);
            process.stdout.write("\r\u001b[K"); // Clear the line
        }
    };
};
