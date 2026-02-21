
import { serve } from "@hono/node-server";
import open from "open";
import chalk from "chalk";
import { createApp } from "./server";

export const ui = async (port = 3000) => {
    const app = createApp();

    console.log(chalk.cyan(`\nStarting Via UI server on http://localhost:${port}...`));

    serve({
        fetch: app.fetch,
        port
    }, (info) => {
        console.log(chalk.green.bold(`\n✓ Via UI is ready! Open your browser at http://localhost:${info.port}`));
        open(`http://localhost:${info.port}`);
    });
};
