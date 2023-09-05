import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import * as semver from 'semver';

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
