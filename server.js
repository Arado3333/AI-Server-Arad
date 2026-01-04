// import { uploadToCloudinary } from "./middlewares/uploadToCloudinary.js";

import express from "express";
import cors from "cors";
import "dotenv/config";
import { writeToSystem } from "./middlewares/writeToSystem.js";
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

const server = express();
const PORT = process.env.PORT || 3000;
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    limit: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

server.use(cors());
server.use(helmet());
server.use(limiter);
server.use(express.json({ limit: "5mb" }));

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini API endpoints - Text Chat
server.post("/api/chat", async (req, res) => {
    try {
        let chat = ai.chats.create({
            model: req.body.model,
            history: req.body.history,
            config: {
                temperature: 0.5,
                maxOutputTokens: 1200,
                systemInstruction: req.body.systemInstruction,
            },
        });

        let response = await chat.sendMessage({
            message: req.body.message,
        });
        res.status(200).json({
            role: "model",
            parts: [{ text: response.text }],
        });
    } catch (error) {
        res.status(500).json({ error: "Error sending message to gemini" });
        console.log(error);
    }
});

server.post("/api/generate", async (req, res) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: req.body.contents[0].parts.text,
            config: {
                thinkingConfig: {
                    thinkingLevel: "medium",
                },
                maxOutputTokens: 2500,
                temperature: 1.0,
                systemInstruction: process.env.SYSTEM_PROMPT,
            },
        });
        let text = response.text;

        res.status(200).send(text);
    } catch (error) {
        res.status(500).json({ error: "Error sending message to gemini" });
    }
});

// Gemini API endpoints - Text with Image
server.post("/api/chat/with-image", writeToSystem, async (req, res) => {
    console.log("Communication with Gemini API");

    //Image upload
    try {
        const myfile = await ai.files.upload({
            file: "./images/tempImg.jpeg",
            config: { mimeType: "image/jpeg" },
        });

        //gemini response
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: createUserContent([
                createPartFromUri(myfile.uri, myfile.mimeType),
                { text: req.body.message },
            ]),
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Error uploading image" });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
