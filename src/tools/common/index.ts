import { parseArgs } from 'util'
import { CliArgs } from './models'

export * from './models'
export * from './dotnet-tool'

//import { randomUUID } from 'node:crypto';
//import * as semver from 'semver';

export function parseCliArgs(): CliArgs {
    return parseArgs({
        options: {
            command: { type: 'string', short: 'c' }
        }
    }).values as CliArgs
}

/*
export function isExplicitVersion(versionSpec: string): boolean {
    let uuid = randomUUID();
    console.log(uuid);

    const c = semver.clean(versionSpec);
    console.log('isExplicit: ' + c);

    const valid = semver.valid(c) != null;
    console.log('explicit? ' + valid);

    return valid;
}*/
