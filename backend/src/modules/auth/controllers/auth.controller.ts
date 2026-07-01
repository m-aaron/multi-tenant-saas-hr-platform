import type { Request, Response } from 'express';
import { registerUser } from '#modules/auth/services/auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
    await registerUser(req.body);
    res.status(201).json({ message: 'User registered successfully' });
}