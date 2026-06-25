
import { Request, Response } from "express";
const prisma = require("../lib/prisma")
const OpenAI = require('openai');
import dotenv from "dotenv";
import { getEmbedder, cosineSimilarity } from './documentController';
import { createMcpClient } from '../lib/mcpClient';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const generateConversation = async (req: Request, res: Response) => {
    try {
        const { question } = req.body;
        const userId = (req as any).user.id;
        const response = await prisma.conversation.create({
            data: {
                title: question,
                userId
            }
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

        const history = await prisma.chat.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        })

        const chatHistory = history.map((chat: any) => ({
            role: chat.role,
            content: chat.message
        }))

        // Save the user's message to the database
        await prisma.chat.create({
            data: { role: "user", message: question, conversationId }
        });

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
                    let embedding = chunk.embedding;
                    if (typeof embedding === 'string') {
                        embedding = JSON.parse(embedding);
                    } else if (!Array.isArray(embedding) && typeof embedding === 'object' && embedding !== null) {
                        embedding = Object.values(embedding);
                    }
                    const score = cosineSimilarity(queryEmbedding, embedding);
                    return { text: chunk.text, score };
                });

                // Sort by score descending and take top 5
                chunksWithScores.sort((a: any, b: any) => b.score - a.score);
                const topChunks = chunksWithScores.slice(0, 5);
                const context = topChunks.map((c: any) => c.text).join('\n\n');
                systemPrompt = `You are a helpful assistant that answers questions strictly based on the provided context.
                Context:
                ${context}
                Rules:
                - Answer only from the context above. Do not use outside knowledge.
                - Be concise and direct.
                - If the answer isn't in the context, say: "I don't have enough information to answer that."`;


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


export const generateTextWithMcp = async (req: Request, res: Response) => {
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

        // let systemPrompt = "You are a helpful and expert AI assistant. Please provide clear and concise answers.";
        let systemPrompt = `You are a helpful and expert AI assistant. 
You have been granted access to external tools that allow you to interact with the user's Gmail account (reading emails, searching, sending, etc).
When a user asks you to perform an action related to their email, you MUST use the provided tools to fulfill their request. Do not refuse.
Please provide clear and concise answers based on the tool results.`;

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

        // 1. Get the connected client
        const mcpClient = await createMcpClient();
        // 2. Fetch available tools from the Gmail MCP server
        const { tools: mcpTools } = await mcpClient.listTools();
        // 3. Convert MCP tools to OpenAI/Groq format
        const formattedTools = mcpTools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));

        // Generate AI response
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            tools: formattedTools, // <--- Add the tools here
            tool_choice: "auto"
        });

        let responseMessage = response.choices[0].message;

        // If the AI decides to use a tool, handle it
        if (responseMessage.tool_calls) {
            // Append the assistant's tool call to the conversation
            messages.push(responseMessage);

            // Execute each tool call
            for (const toolCall of responseMessage.tool_calls) {
                const toolArgs = JSON.parse(toolCall.function.arguments);

                console.log(`Executing tool: ${toolCall.function.name}`, toolArgs);

                try {
                    const toolResult = await mcpClient.callTool({
                        name: toolCall.function.name,
                        arguments: toolArgs
                    });

                    // Add the tool result back to the messages array
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolCall.function.name,
                        content: JSON.stringify(toolResult.content)
                    });
                } catch (err) {
                    console.error(`Error executing tool ${toolCall.function.name}:`, err);
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolCall.function.name,
                        content: JSON.stringify({ error: String(err) })
                    });
                }
            }

            // Call the AI again with the tool results so it can form a final answer
            const finalResponse = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            });

            responseMessage = finalResponse.choices[0].message;
        }

        // Save the AI's final response to the database
        await prisma.chat.create({
            data: {
                role: "assistant", // it's always the assistant replying here
                message: responseMessage.content || "[No text returned]",
                conversationId
            }
        });

        res.json({ message: responseMessage.content });
        // res.json(response);

    }
    catch (err) {
        res.status(400).json({ message: (err as Error).message })
    }
}
