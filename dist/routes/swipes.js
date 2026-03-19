"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const Swipe_1 = require("../models/Swipe");
const router = (0, express_1.Router)();
// POST /swipe
// Body: { userId: string, movieId: string (ObjectId), type: 'like'|'dislike' }
router.post("/", async (req, res) => {
    try {
        const { userId, movieId, type } = req.body ?? {};
        if (!userId || typeof userId !== "string") {
            return res.status(400).json({ error: "Missing/invalid userId" });
        }
        if (!movieId || typeof movieId !== "string") {
            return res.status(400).json({ error: "Missing/invalid movieId" });
        }
        if (type !== "like" && type !== "dislike") {
            return res.status(400).json({ error: "type must be 'like' or 'dislike'" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({ error: "movieId is not a valid ObjectId" });
        }
        const movieObjectId = new mongoose_1.Types.ObjectId(movieId);
        const swipe = await Swipe_1.Swipe.findOneAndUpdate({ userId, movieId: movieObjectId }, { $set: { type } }, {
            new: true,
            upsert: true,
            runValidators: true,
            context: "query",
        }).lean();
        return res.status(200).json({ swipe });
    }
    catch (err) {
        return res.status(500).json({ error: err?.message ?? String(err) });
    }
});
exports.default = router;
