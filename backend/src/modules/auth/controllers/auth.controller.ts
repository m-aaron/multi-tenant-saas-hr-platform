import type { Request, Response } from 'express';
import { registerOrganization } from '#modules/auth/services/auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
    await registerOrganization(req.body);
    res.status(201).json({ message: 'Organization registered successfully' });
}