import pino, { type LoggerOptions } from 'pino';


const isProduction = process.env['NODE_ENV'] === 'production';

const options: LoggerOptions = {
    level: isProduction ? 'info' : 'debug',
};

if (!isProduction) {
    options.transport = {
        target: 'pino-pretty',
        options: { colorize: true },
    };
}

export const logger = pino(options);