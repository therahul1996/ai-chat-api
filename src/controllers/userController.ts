
import { Request, Response } from "express";
// import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const prisma = require("../lib/prisma")

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, email, age, password } = req.body;
        console.log(req.body)
        const hashPassword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: { firstname, lastname, email, age, password: hashPassword }
        })
        res.status(201).json(user);
    }
    catch (err) {
        console.error("Error creating user:", err);
        res.status(400).json({ message: "User already exist or invalid Cred" })
    }
}
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updateUser = await prisma.user.update({
            where: { id: id },
            data: updateData
        })
        if (!updateUser) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(201).json(updateUser);
    }
    catch (err) {
        res.status(400).json({ message: (err as Error).message })
    }
}
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const getUser = await prisma.user.findUnique({
            where: { id: id },
        })
        res.status(201).json(getUser);
    }
    catch (err) {
        res.status(400).json({ message: (err as Error).message })
    }
}
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email: email }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const isPasswordValid = bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" })
        }
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "1d" })
        res.status(201).json({ token });
    }
    catch (err) {
        res.status(400).json({ message: "User already exist or invalid Cred" })
    }
}