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
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',

    db: {
        host: getEnv('DATABASE_HOST'),
        port: Number(getEnv('DATABASE_PORT')),
        name: getEnv('DATABASE_NAME'),
        user: getEnv('DATABASE_USER'),
        password: getEnv('DATABASE_PASSWORD'),
    },

    jwt: {
        accessTokenSecret: getEnv('ACCESS_TOKEN_SECRET'),
        accessTokenExpires: getEnv('ACCESS_TOKEN_EXPIRES'),
        refreshTokenSecret: getEnv('REFRESH_TOKEN_SECRET'),
        refreshTokenExpires: getEnv('REFRESH_TOKEN_EXPIRES')
    }
} as const;