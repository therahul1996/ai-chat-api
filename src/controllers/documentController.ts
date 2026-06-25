import { Request, Response } from "express";
import crypto from "crypto";
const prisma = require("../lib/prisma");
const pdfParse = require("pdf-parse");
// Helper for generating embeddings locally using Transformers.js
let embedder: any;
export async function getEmbedder() {
    if (!embedder) {
        // dynamic import because @xenova/transformers is ESM
        const { pipeline } = await eval(`import('@xenova/transformers')`);
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}


function chunkText(text: string, chunkSize = 1000, overlap = 200) {
    const chunks: string[] = [];
    let i = 0;
    const stride = chunkSize - overlap;

    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        if (i + chunkSize >= text.length) break; // last chunk captured, stop
        i += stride;
    }
    return chunks;
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        const a = vecA[i] as number;
        const b = vecB[i] as number;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const buffer = req.file.buffer;
        const filename = req.file.originalname;
        const userId = (req as any).user.id;
        const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

        const existingDocument = await prisma.document.findFirst({
            where: {
                userId: userId,
                contentHash: contentHash
            }
        });

        if (existingDocument) {
            return res.status(200).json({
                message: "Document already exists. Duplicate upload skipped.",
                documentId: existingDocument.id
            });
        }

        let content = "";
        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            content = pdfData.text;
        } else {
            content = buffer.toString('utf-8');
        }

        // PostgreSQL does not support null bytes (\x00) in text columns.
        content = content.replace(/\0/g, '');

        const document = await prisma.document.create({
            data: { filename, content, contentHash, userId }
        });

        const chunkTexts = chunkText(content).filter(c => c.trim().length > 50);
        const extract = await getEmbedder();

        const embeddings = await Promise.all(
            chunkTexts.map(chunk => extract(chunk, { pooling: 'mean', normalize: true }))
        );

        await prisma.documentChunk.createMany({
            data: chunkTexts.map((text, i) => ({
                text,
                embedding: Array.from(embeddings[i].data),
                documentId: document.id
            }))
        });


        res.status(201).json({ message: "Document uploaded and processed successfully", documentId: document.id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message });
    }
}