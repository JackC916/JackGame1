"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const mongoose_1 = __importDefault(require("mongoose"));
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
async function start() {
    await (0, db_1.connectMongo)();
    const server = app_1.default.listen(port, () => {
        console.log(`Server listening on :${port}`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        server.close();
        await mongoose_1.default.connection.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exitCode = 1;
});
