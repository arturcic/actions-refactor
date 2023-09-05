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

export function isExplicitVersion(versionSpec: string): boolean {
    let uuid = randomUUID();
    console.log(uuid);

    const c = semver.clean(versionSpec);
    console.log('isExplicit: ' + c);

    const valid = semver.valid(c) != null;
    console.log('explicit? ' + valid);

    return valid;
}