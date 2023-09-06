import { IBuildAgent, IExecResult, ISettingsProvider } from './models.ts';
import os from 'os';
import fs from 'fs';
import path from 'path';

import * as semver from 'semver';

export interface IDotnetTool {
    get toolName(): string;

    disableTelemetry(): void;

    install(): Promise<string>;
}

export abstract class DotnetTool implements IDotnetTool {

    private static readonly nugetRoot: string = 'https://azuresearch-usnc.nuget.org/';

    protected constructor(protected buildAgent: IBuildAgent) {
    }

    abstract get settingsProvider(): ISettingsProvider;

    abstract get toolName(): string;

    public disableTelemetry(): void {
        this.buildAgent.debug('disableTelemetry');
        this.buildAgent.setVariable('DOTNET_CLI_TELEMETRY_OPTOUT', 'true');
        this.buildAgent.setVariable('DOTNET_NOLOGO', 'true');
    }

    public execute(cmd: string, args: string[]): Promise<IExecResult> {
        this.buildAgent.info(`Command: ${cmd} ${args.join(' ')}`);
        return this.buildAgent.exec(cmd, args);
    }

    public async install(): Promise<string> {
        const setupSettings = this.settingsProvider.getSetupSettings();

        this.buildAgent.info('--------------------------');
        this.buildAgent.info(`Acquiring ${this.toolName} version spec: ${setupSettings.versionSpec}`);
        this.buildAgent.info('--------------------------');

        let version: string | null = '';
        let checkLatest = setupSettings.preferLatestVersion;
        if (this.isExplicitVersion(setupSettings.versionSpec)) {
            checkLatest = false; // check latest doesn't make sense when explicit version
            version = setupSettings.versionSpec;

            
        }

        let toolPath: string = '';
        if (!checkLatest) {
            //
            // Let's try and resolve the version spec locally first
            //
            toolPath = this.buildAgent.find(this.toolName, setupSettings.versionSpec);
        }

        if (!toolPath) {
            if (this.isExplicitVersion(setupSettings.versionSpec)) {
                //
                // Explicit version was specified. No need to query for list of versions.
                //
                version = setupSettings.versionSpec;
            } else {
                //
                // Let's query and resolve the latest version for the versionSpec.
                // If the version is an explicit version (1.1.1 or v1.1.1) then no need to query.
                // If your tool doesn't offer a mechanism to query,
                // then it can only support exact version inputs.
                //
                version = await this.queryLatestMatch(this.toolName, setupSettings.versionSpec, setupSettings.includePrerelease);
                if (!version) {
                    throw new Error(`Unable to find ${this.toolName} version '${setupSettings.versionSpec}'.`);
                }

                //
                // Check the cache for the resolved version.
                //
                toolPath = this.buildAgent.find(this.toolName, version);
            }
            if (!toolPath) {
                //
                // Download, extract, cache
                //
                toolPath = await this.acquireTool(this.toolName, version, setupSettings.ignoreFailedSources);
            }
        }

        this.buildAgent.info('--------------------------');
        this.buildAgent.info(`${this.toolName} version: ${version} installed.`);
        this.buildAgent.info('--------------------------');
        //
        // Prepend the tool's path. This prepends the PATH for the current process and
        // instructs the agent to prepend for each task that follows.
        //
        this.buildAgent.debug(`toolPath: ${toolPath}`);

        if (os.platform() !== 'win32' && !this.buildAgent.getVariable('DOTNET_ROOT')) {
            let dotnetPath = await this.buildAgent.which('dotnet');
            dotnetPath = fs.readlinkSync(dotnetPath) || dotnetPath;
            const dotnetRoot = path.dirname(dotnetPath);
            this.buildAgent.setVariable('DOTNET_ROOT', dotnetRoot);
        }
        this.buildAgent.addPath(toolPath);

        return toolPath;
    }

    private async queryLatestMatch(toolName: string, versionSpec: string, includePrerelease: boolean): Promise<string | null> {
        this.buildAgent.debug(
            `querying tool versions for ${toolName}${versionSpec ? `@${versionSpec}` : ''} ${includePrerelease ? 'including pre-releases' : ''}`
        );

        const toolNameParam = encodeURIComponent(toolName.toLowerCase());
        const prereleaseParam = includePrerelease ? 'true' : 'false';
        const downloadPath = `${DotnetTool.nugetRoot}query?q=${toolNameParam}&prerelease=${prereleaseParam}&semVerLevel=2.0.0&take=1`;

        const res = await fetch(downloadPath);

        if (!res || !res.ok) {
            this.buildAgent.debug(`failed to query latest version for ${toolName} from ${downloadPath}. Status code: ${res ? res.status : 'unknown'}`);
            return null;
        }

        const { data } = await res.json();

        const versions = (data[0].versions as { version: string }[]).map(x => x.version);
        if (!versions || !versions.length) {
            return null;
        }

        this.buildAgent.debug(`got versions: ${versions.join(', ')}`);

        let version = semver.maxSatisfying(versions, versionSpec, { includePrerelease });
        if (version) {
            this.buildAgent.info(`matched: ${version}`);
        } else {
            this.buildAgent.info('match not found');
        }

        return version;
    }

    private async acquireTool(toolName: string, version: string, ignoreFailedSources: boolean): Promise<string> {
        const tempDirectory = await this.buildAgent.createTempDir();
        let args = ['tool', 'install', toolName, '--tool-path', tempDirectory];

        if (ignoreFailedSources) {
            args.push('--ignore-failed-sources');
        }

        let semverVersion = this.cleanVersion(version);
        if (semverVersion) {
            args = args.concat(['--version', version]);

            const result = await this.execute('dotnet', args);
            const status = result.code === 0 ? 'success' : 'failure';
            const message = result.code === 0 ? result.stdout : result.stderr;

            this.buildAgent.debug(`tool install result: ${status} ${message}`);

            if (result.code) {
                throw new Error('Error installing tool');
            }

            return await this.buildAgent.cacheDir(tempDirectory, toolName, version);
        } else {
            throw new Error('Invalid version');
        }
    }

    private isExplicitVersion(versionSpec: string): boolean {
        const cleanedVersionSpec = semver.clean(versionSpec);
        const valid = semver.valid(cleanedVersionSpec) != null;
        this.buildAgent.debug(`Is version explicit? ${valid}`);

        return valid;
    }
    private cleanVersion(version: string): string | null {
        this.buildAgent.debug('cleaning: ' + version);
        return semver.clean(version);
    }
}