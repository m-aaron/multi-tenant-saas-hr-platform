import { signAccessToken, signRefreshToken } from "./jwt.service.js";
import type { JwtPayload } from "../types/auth.type.js";
import type { TokenPair } from "#modules/auth/types/auth.type.js";


export function generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return { accessToken, refreshToken };
}