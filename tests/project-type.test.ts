import { detectProjectType } from "../src/utils/ai/project-type";
import * as fs from "fs";
import * as path from "path";

jest.mock("fs");

describe("detectProjectType", () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 'hono' if hono is in dependencies", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { hono: "1.0.0" }
        }));

        expect(detectProjectType()).toBe("hono");
    });

    it("should return 'express' if express is in dependencies", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { express: "4.17.1" }
        }));

        expect(detectProjectType()).toBe("express");
    });

    it("should return 'nest' if @nestjs/core is in dependencies", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { "@nestjs/core": "8.0.0" }
        }));

        expect(detectProjectType()).toBe("nest");
    });

    it("should return 'cdk' if aws-cdk-lib is in dependencies", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { "aws-cdk-lib": "2.0.0" }
        }));

        expect(detectProjectType()).toBe("cdk");
    });

    it("should return 'next' if next is in dependencies", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { next: "12.0.0" }
        }));

        expect(detectProjectType()).toBe("next");
    });

    it("should return 'generic' if no known framework is detected", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            dependencies: { lodash: "4.17.21" }
        }));

        expect(detectProjectType()).toBe("generic");
    });

    it("should return 'generic' if package.json does not exist", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        expect(detectProjectType()).toBe("generic");
    });
});
