import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';


const nodeEnv = process.env['NODE_ENV'] ?? 'development';

const envFile =
    nodeEnv === 'test'
        ? '.env.test'
        : '.env';

dotenvExpand.expand(
    dotenv.config({
        path: envFile,
    }),
);

function getEnv(key: string,): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
}

function getOptionalEnv(key: string): string | undefined {
    const val = process.env[key];
    return val && val.trim().length > 0 ? val.trim() : undefined;
}

const databaseUrl =
    getOptionalEnv('DATABASE_URL') ??
    getOptionalEnv('DATABASE_PRIVATE_URL') ??
    getOptionalEnv('DATABASE_PUBLIC_URL') ??
    getOptionalEnv('POSTGRES_URL');

export const env = {
    port: Number(process.env['PORT'] ?? 4000),
    NODE_ENV: nodeEnv,

    db: databaseUrl ? {
        url: databaseUrl
    } : {
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