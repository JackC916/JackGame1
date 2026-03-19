"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri)
        throw new Error("Missing env var: MONGODB_URI");
    const dbName = process.env.MONGODB_DB ?? "jackGame";
    // Note: `dbName` is the database portion used by the connection, so it
    // lets us keep `MONGODB_URI` in a common format.
    await mongoose_1.default.connect(mongoUri, { dbName });
}
