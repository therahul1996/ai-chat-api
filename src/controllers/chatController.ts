
import { Request, Response } from "express";
const prisma = require("../lib/prisma")
const OpenAI = require('openai');
import dotenv from "dotenv";
import { getEmbedder, cosineSimilarity } from './documentController';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const generateConversation = async (req: Request, res: Response) => {
    try {
        const { question } = req.body;
        const response = await prisma.conversation.create({
            data: { title: question }
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
        const { question, documentId } = req.body;
        if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" })
        if (!question) return res.status(400).json({ message: "Question is required" })

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) return res.status(404).json({ message: "Conversation not found" })

        // Save the user's message to the database
        await prisma.chat.create({
            data: { role: "user", message: question, conversationId }
        });

        const history = await prisma.chat.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        })


        const chatHistory = history.map((chat: any) => ({
            role: chat.role,
            content: chat.message
        }))

        let systemPrompt = "You are a helpful and expert AI assistant. Please provide clear and concise answers.";

        if (documentId) {
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: { chunks: true }
            });

            if (document) {
                const extract = await getEmbedder();
                const queryOutput = await extract(question, { pooling: 'mean', normalize: true });
                const queryEmbedding = Array.from(queryOutput.data) as number[];

                // Calculate similarity for each chunk
                const chunksWithScores = document.chunks.map((chunk: any) => {
                    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
                    return { text: chunk.text, score };
                });

                // Sort by score descending and take top 5
                chunksWithScores.sort((a: any, b: any) => b.score - a.score);
                const topChunks = chunksWithScores.slice(0, 5);
                const context = topChunks.map((c: any) => c.text).join('\n\n');

                systemPrompt = `You are a helpful assistant. Use the following document context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n${context}`;
            }
        }

        const messages = [{ role: "system", content: systemPrompt }, ...chatHistory, { role: "user", content: question }]

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
