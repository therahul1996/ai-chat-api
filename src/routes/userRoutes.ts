import { Router } from "express";
import { deleteUser, getAllUsers, getUserById, loginUser, registerUser, updateUser } from "../controllers/userController";


const router = Router();
/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management APIs
 *
 * /api/users:
 *   post:
 *     summary: Register user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: number
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Register user
 */
router.post('/', registerUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: number
 *     responses:
 *       201:
 *         description: Update user successfully
 *       400:
 *         description: Invalid credentials
 */
router.patch('/:id', updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by Id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get user by Id
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Login user successfully
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

export default router;

