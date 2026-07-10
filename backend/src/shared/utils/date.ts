export function today(): string {
    return new Date().toISOString().slice(0, 10);
}


const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;


/**
 * Parse a duration string like `15m`, `1.5h`, `2d`, `30s` into milliseconds.
 * Accepts optional whitespace and uppercase units. Supports decimal values and negative values.
 */
export function parseDurationToMilliseconds(duration: string): number {

    const DURATION_PATTERN = /^\s*([-+]?\d+(?:\.\d+)?)\s*([smhdSMHD])\s*$/;

    const match = duration.match(DURATION_PATTERN);

    if (!match) {
        throw new Error(`Invalid duration: ${duration}`);
    }

    const value = parseFloat(match[1]!);
    if (!Number.isFinite(value)) {
        throw new Error(`Invalid numeric duration value: ${match[1]}`);
    }

    const unit = match[2]!.toLowerCase();

    switch (unit) {
        case 's':
            return value * MILLISECONDS_PER_SECOND;
        case 'm':
            return value * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
        case 'h':
            return value * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
        case 'd':
            return value * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
        default:
            throw new Error(`Unsupported duration unit: ${unit}`);
    }

}


/**
 * Add a duration string (same format accepted by `parseDurationToMilliseconds`) to a Date.
 * This preserves the original API shape but the function name clarifies the intent.
 */
export function addDuration(date: Date, duration: string): Date {
    return new Date(date.getTime() + parseDurationToMilliseconds(duration));
}