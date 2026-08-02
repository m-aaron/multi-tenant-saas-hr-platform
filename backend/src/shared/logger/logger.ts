import pino, { type LoggerOptions } from 'pino';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const isProduction = process.env['NODE_ENV'] === 'production';

// Check if pino-pretty is available (it's a devDependency and won't be
// present in production images, even if NODE_ENV is not 'production').
const isPinoPrettyAvailable = (() => {
    try {
        require.resolve('pino-pretty');
        return true;
    } catch {
        return false;
    }
})();

const options: LoggerOptions = {
    level: isProduction ? 'info' : 'debug',
};

if (!isProduction && isPinoPrettyAvailable) {
    options.transport = {
        target: 'pino-pretty',
        options: { colorize: true },
    };
}

export const logger = pino(options);