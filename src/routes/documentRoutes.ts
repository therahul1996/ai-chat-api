import { Router } from "express";
import { uploadDocument } from "../controllers/documentController";
import { authenticateToken } from "../middlewares/authMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document upload and Q&A
 *
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document (PDF or Text)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded and processed
 */
router.post('/upload', authenticateToken as any, upload.single('file'), uploadDocument as any);

export default router;
