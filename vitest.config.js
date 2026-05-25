"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            thresholds: {
                statements: 70,
                branches: 60,
                functions: 80,
                lines: 70,
            },
            exclude: ["src/cli.ts"],
        },
    },
});
//# sourceMappingURL=vitest.config.js.map