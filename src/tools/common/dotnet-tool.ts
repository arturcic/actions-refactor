import { IBuildAgent, IExecResult, ISettingsProvider } from './models'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

import * as semver from 'semver'

export interface IDotnetTool {
    get toolName(): string

    disableTelemetry(): void

    install(): Promise<string>
}

export abstract class DotnetTool implements IDotnetTool {
    private static readonly nugetRoot: string = 'https://azuresearch-usnc.nuget.org/'

    constructor(protected buildAgent: IBuildAgent) {}

    abstract get settingsProvider(): ISettingsProvider

    abstract get toolName(): string

    disableTelemetry(): void {
        this.buildAgent.info('Disable Telemetry')
        this.buildAgent.setVariable('DOTNET_CLI_TELEMETRY_OPTOUT', 'true')
        this.buildAgent.setVariable('DOTNET_NOLOGO', 'true')
    }

    async execute(cmd: string, args: string[]): Promise<IExecResult> {
        this.buildAgent.info(`Command: ${cmd} ${args.join(' ')}`)
        return this.buildAgent.exec(cmd, args)
    }

    async install(): Promise<string> {
        const whichPath = await this.buildAgent.which('dotnet', true)
        await this.setDotnetRoot()

        this.buildAgent.debug(`whichPath: ${whichPath}`)
        const setupSettings = this.settingsProvider.getSetupSettings()

        let version: string | null = semver.clean(setupSettings.versionSpec) || setupSettings.versionSpec
        this.buildAgent.info('--------------------------')
        this.buildAgent.info(`Acquiring ${this.toolName} for version spec: ${version}`)
        this.buildAgent.info('--------------------------')

        if (!this.isExplicitVersion(version)) {
            version = await this.queryLatestMatch(this.toolName, version, setupSettings.includePrerelease)
            if (!version) {
                throw new Error(`Unable to find ${this.toolName} version '${version}'.`)
            }
        }

        let toolPath: string | null = null
        if (!setupSettings.preferLatestVersion) {
            // Let's try and resolve the version spec locally first
            toolPath = this.buildAgent.findLocalTool(this.toolName, version)
        }
        if (!toolPath) {
            // Download, extract, cache
            toolPath = await this.installTool(this.toolName, version, setupSettings.ignoreFailedSources)
        }

        this.buildAgent.info('--------------------------')
        this.buildAgent.info(`${this.toolName} version: ${version} installed.`)
        this.buildAgent.info('--------------------------')

        // Prepend the tool's path. This prepends the PATH for the current process and
        // instructs the agent to prepend for each task that follows.
        this.buildAgent.info(`Prepending ${toolPath} to PATH`)
        this.buildAgent.debug(`toolPath: ${toolPath}`)

        this.buildAgent.addPath(toolPath)

        return toolPath
    }

    protected async setDotnetRoot(): Promise<void> {
        if (os.platform() !== 'win32' && !this.buildAgent.getVariable('DOTNET_ROOT')) {
            let dotnetPath = await this.buildAgent.which('dotnet', true)
            dotnetPath = fs.readlinkSync(dotnetPath) || dotnetPath
            const dotnetRoot = path.dirname(dotnetPath)
            this.buildAgent.setVariable('DOTNET_ROOT', dotnetRoot)
        }
    }

    private async queryLatestMatch(toolName: string, versionSpec: string, includePrerelease: boolean): Promise<string | null> {
        this.buildAgent.info(
            `Querying tool versions for ${toolName}${versionSpec ? `@${versionSpec}` : ''} ${includePrerelease ? 'including pre-releases' : ''}`
        )

        const toolNameParam = encodeURIComponent(toolName.toLowerCase())
        const prereleaseParam = includePrerelease ? 'true' : 'false'
        const downloadPath = `${DotnetTool.nugetRoot}query?q=${toolNameParam}&prerelease=${prereleaseParam}&semVerLevel=2.0.0&take=1`

        const response = await fetch(downloadPath)

        if (!response || !response.ok) {
            this.buildAgent.warn(`failed to query latest version for ${toolName} from ${downloadPath}. Status code: ${response ? response.status : 'unknown'}`)
            return null
        }

        const { data }: { data: { versions: { version: string }[] }[] } = await response.json()

        const versions = data[0].versions.map(x => x.version)
        if (!versions || !versions.length) {
            return null
        }

        this.buildAgent.debug(`got versions: ${versions.join(', ')}`)

        const version = semver.maxSatisfying(versions, versionSpec, { includePrerelease })
        if (version) {
            this.buildAgent.info(`Found matching version: ${version}`)
        } else {
            this.buildAgent.info('match not found')
        }

        return version
    }

    private async installTool(toolName: string, version: string, ignoreFailedSources: boolean): Promise<string> {
        const semverVersion = semver.clean(version)
        if (!semverVersion) {
            throw new Error(`Invalid version spec: ${version}`)
        }

        const tempDirectory = await this.buildAgent.createTempDir()
        const args = ['tool', 'install', toolName, '--tool-path', tempDirectory, '--version', semverVersion]
        if (ignoreFailedSources) {
            args.push('--ignore-failed-sources')
        }

        const result = await this.execute('dotnet', args)
        const status = result.code === 0 ? 'success' : 'failure'
        const message = result.code === 0 ? result.stdout : result.stderr

        this.buildAgent.debug(`Tool install result: ${status} ${message}`)
        if (result.code !== 0) {
            throw new Error(message)
        }
        this.buildAgent.info(message)

        return await this.buildAgent.cacheDir(tempDirectory, toolName, semverVersion)
    }

    private isExplicitVersion(versionSpec: string): boolean {
        const cleanedVersionSpec = semver.clean(versionSpec)
        const valid = semver.valid(cleanedVersionSpec) != null
        this.buildAgent.debug(`Is version explicit? ${valid}`)

        return valid
    }
}
