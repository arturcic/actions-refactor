import { parseArgs } from 'node:util';

export interface CliArgs {
    command: string | undefined;
}

export function parseCliArgs(): CliArgs {
    return parseArgs({
        options: {
            command: { type: 'string', short: 'c' }
        }
    }).values as CliArgs;
}
