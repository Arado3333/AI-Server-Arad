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

const server = express();
const PORT = process.env.PORT || 3000;

server.use(cors());
server.use(express.json({ limit: "50mb" }));

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
    // console.log(req.body.contents);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: req.body.contents[0].parts.text,
            config: {
                maxOutputTokens: 1000,
                temperature: 0.1,
                systemInstruction:
                    "You are a tailwindcss wizard! Master of tailwindcss, developers need your help with designing their websites with tailwindcss quickly and effortlessly. Your job is to process the developer's request, i.e what element he wants to make or what design he wants to implement, and in response, give him the exact tailwindcss code to acheive his desired design. if it's complex components that needs recreation, provide fresh html code with the necessary elements and styles applied in tailwindcss class names. the response should be concise, on-point and without hallucinations. if you can't provide some style code for certain request, provide code that reaches the desired design as close as possible. for class names only, i.e if not a whole component, wrap the response text inside a <span></span> element. return text like this: <span>YOUR_TAILWIND_CODE_HERE</span>. For new components, generate the html code as inside a <section></section> element. make it suitable for react jsx",
            },
        });
        let text = response.text;
        // console.log(text);

        res.status(200).send(text);
    } catch (error) {
        res.status(500).json({ error: "Error sending message to gemini" });
        console.log(error);
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
