import dotenv from 'dotenv';


dotenv.config();

function getEnv(key: string,): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
}

export const env = {
    port: Number(process.env['PORT'] ?? 4000),

    accessTokenSecret: getEnv('ACCESS_TOKEN_SECRET'),
    accessTokenExpires: getEnv('ACCESS_TOKEN_EXPIRES'),
    refreshTokenSecret: getEnv('REFRESH_TOKEN_SECRET'),
    refreshTokenExpires: getEnv('REFRESH_TOKEN_EXPIRES')
} as const;