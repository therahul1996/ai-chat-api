
import { Request, Response } from "express";
const prisma = require("../lib/prisma")
const OpenAI = require('openai');
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: 'https://api.groq.com/openai/v1', // swap for any provider
});

export const generateConversation = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const response = await prisma.conversation.create({
            data: { title }
        })
        res.json({ conversationId: response.id });
    }
    catch (err) {
        res.status(400).json({ message: (err as Error).message })
    }
}

export const generateText = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { role, message } = req.body;

        if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" })
        if (!role || !message) return res.status(400).json({ message: "Role and message are required" })

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) return res.status(404).json({ message: "Conversation not found" })

        // Save the user's message to the database
        await prisma.chat.create({
            data: { role, message, conversationId }
        });

        const history = await prisma.chat.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        })


        const chatHistory = history.map((chat: any) => ({
            role: chat.role,
            content: chat.message
        }))
        const messages = [{ role: "system", content: "You are a helpful and expert AI assistant. Please provide clear and concise answers." }, ...chatHistory, { role, content: message }]

        // Generate AI response
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        });

        // Save the AI's response to the database
        await prisma.chat.create({
            data: {
                role: response.choices[0].message.role,
                message: response.choices[0].message.content,
                conversationId
            }
        });

        res.json({ message: response.choices[0].message.content });
        // res.json(response);

    }
    catch (err) {
        res.status(400).json({ message: (err as Error).message })
    }
}
