import { Router } from "express";
import { generateConversation, generateText, generateTextWithMcp } from "../controllers/chatController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI management APIs
 *
 * /api/chat:
 *   post:
 *     summary: Post chat
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       201:
 *         description: Create Conversation
 */
router.post('/', authenticateToken as any, generateConversation);


/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI management APIs
 *
 * /api/chat/{conversationId}/messages:
 *   post:
 *     summary: Add a message to a conversation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               documentId:
 *                 type: string
 *                 description: "Document ID for RAG"
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Chat message added
 */
router.post('/:conversationId/messages', authenticateToken as any, generateTextWithMcp);


export default router;

