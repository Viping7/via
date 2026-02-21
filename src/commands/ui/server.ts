
import { Hono } from "hono";
import { cors } from "hono/cors";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getViaDataPath } from "../../utils/paths";
import { gunzipSync } from "zlib";
import { getLayout } from "./templates/layout";

function normalizePaths(node: any) {
    if (node.path) {
        node.path = node.path.replace(/\\/g, '/');
    }
    if (node.dependencies) {
        node.dependencies.forEach(normalizePaths);
    }
}

export const createApp = () => {
    const app = new Hono();
    app.use("/*", cors());

    const mappingPath = getViaDataPath('mapping.json');
    const modulesDir = getViaDataPath('modules');

    app.get("/api/modules", (c) => {
        if (!existsSync(mappingPath)) {
            return c.json({ modules: [] });
        }

        try {
            const mapping = JSON.parse(readFileSync(mappingPath, "utf-8"));
            const modules = Object.entries(mapping).map(([name, id]) => {
                const viaPath = join(modulesDir, `${id}.via`);
                if (existsSync(viaPath)) {
                    const compressed = readFileSync(viaPath);
                    const data = JSON.parse(gunzipSync(compressed).toString());
                    if (data.deps) {
                        normalizePaths(data.deps);
                    }
                    return {
                        name,
                        id,
                        ...data
                    };
                }
                return { name, id, error: "Module file missing" };
            });

            return c.json({ modules });
        } catch (e) {
            return c.json({ error: "Failed to load modules", details: (e as Error).message }, 500);
        }
    });

    app.get("/", (c) => {
        return c.html(getLayout());
    });

    return app;
};
