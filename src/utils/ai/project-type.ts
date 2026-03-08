import { readFileSync, existsSync } from "fs";
import * as path from "path";

export type ProjectType = "hono" | "express" | "nest" | "cdk" | "next" | "next-frontend" | "next-backend" | "generic";

export function detectProjectType(): ProjectType {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!existsSync(packageJsonPath)) {
        return "generic";
    }

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        if (dependencies["hono"]) {
            return "hono";
        }

        if (dependencies["express"]) {
            return "express";
        }

        if (dependencies["@nestjs/core"]) {
            return "nest";
        }

        if (dependencies["aws-cdk-lib"] || dependencies["aws-cdk"]) {
            return "cdk";
        }

        if (dependencies["next"]) {
            return "next";
        }

        return "generic";
    } catch (error) {
        console.error("Error reading package.json for project type detection:", error);
        return "generic";
    }
}
