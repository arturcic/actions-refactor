import * as os from 'os'
import * as path from 'path'
import { IExecResult } from '@agents/common'
import { DotnetTool } from '@tools/common'
import { GitVersionOutput, GitVersionSettings } from './models'
import { GitVersionSettingsProvider, IGitVersionSettingsProvider } from './settings'

export class GitVersionTool extends DotnetTool {
    get toolName(): string {
        return 'GitVersion.Tool'
    }

    get versionRange(): string | null {
        return '>=5.2.0 <6.1.0'
    }

    get settingsProvider(): IGitVersionSettingsProvider {
        return new GitVersionSettingsProvider(this.buildAgent)
    }

    async run(): Promise<IExecResult> {
        const settings = this.settingsProvider.getGitVersionSettings()
        const workDir = await this.getRepoDir(settings)
        const args = await this.getArguments(workDir, settings)

        await this.setDotnetRoot()

        let toolPath: string | undefined
        const gitVersionPath = this.buildAgent.getVariableAsPath('GITVERSION_PATH')
        if (gitVersionPath) {
            toolPath = path.join(gitVersionPath, os.platform() === 'win32' ? 'dotnet-gitversion.exe' : 'dotnet-gitversion')
        }
        if (!toolPath) {
            toolPath = await this.buildAgent.which('dotnet-gitversion', true)
        }
        return this.execute(toolPath, args)
    }

    writeGitVersionToAgent(output: GitVersionOutput): void {
        const keysFn = Object.keys as <T extends object>(obj: T) => (keyof T)[]
        const keys = keysFn<GitVersionOutput>(output)
        for (const property of keys) {
            const name = this.toCamelCase(property)
            try {
                const value = output[property]?.toString()
                this.buildAgent.setOutput(name, value)
                this.buildAgent.setOutput(`GitVersion_${property}`, value)
                this.buildAgent.setVariable(name, value)
                this.buildAgent.setVariable(`GitVersion_${property}`, value)
            } catch (error) {
                this.buildAgent.error(`Unable to set output/variable for ${property}`)
            }
        }
    }

    protected async getRepoDir(settings: GitVersionSettings): Promise<string> {
        const targetPath = settings.targetPath
        const srcDir = settings.srcDir || '.'
        let workDir: string
        if (!targetPath) {
            workDir = srcDir
        } else {
            if (await this.buildAgent.dirExists(targetPath)) {
                workDir = targetPath
            } else {
                throw new Error(`Directory not found at ${targetPath}`)
            }
        }
        return workDir.replace(/\\/g, '/')
    }

    protected async getArguments(workDir: string, options: GitVersionSettings): Promise<string[]> {
        let args = [workDir, '/output', 'json', '/output', 'buildserver']

        const {
            useConfigFile,
            disableCache,
            disableNormalization,
            configFilePath,
            overrideConfig,
            updateAssemblyInfo,
            updateAssemblyInfoFilename,
            additionalArguments
            //
        } = options

        if (disableCache) {
            args.push('/nocache')
        }

        if (disableNormalization) {
            args.push('/nonormalize')
        }

        if (useConfigFile) {
            if (await this.isValidInputFile('configFilePath', configFilePath)) {
                args.push('/config', configFilePath)
            } else {
                throw new Error(`GitVersion configuration file not found at ${configFilePath}`)
            }
        }

        if (overrideConfig) {
            for (let config of overrideConfig) {
                config = config.trim()
                if (config.match(/([a-zA-Z0-9]+(-[a-zA-Z]+)*=[a-zA-Z0-9\- :.']*)/)) {
                    args.push('/overrideconfig', config)
                }
            }
        }

        if (updateAssemblyInfo) {
            args.push('/updateassemblyinfo')

            // You can specify 'updateAssemblyInfo' without 'updateAssemblyInfoFilename'.
            if (updateAssemblyInfoFilename?.length > 0) {
                if (await this.isValidInputFile('updateAssemblyInfoFilename', updateAssemblyInfoFilename)) {
                    args.push(updateAssemblyInfoFilename)
                } else {
                    throw new Error(`AssemblyInfoFilename file not found at ${updateAssemblyInfoFilename}`)
                }
            }
        }

        if (additionalArguments) {
            args = args.concat(this.argStringToArray(additionalArguments))
        }
        return args
    }

    private argStringToArray(argString: string): string[] {
        const args: string[] = []

        let inQuotes = false
        let escaped = false
        let lastCharWasSpace = true
        let arg = ''

        const append = (c: string): void => {
            // we only escape double quotes.
            if (escaped && c !== '"') {
                arg += '\\'
            }

            arg += c
            escaped = false
        }

        for (let i = 0; i < argString.length; i++) {
            const c = argString.charAt(i)

            if (c === ' ' && !inQuotes) {
                if (!lastCharWasSpace) {
                    args.push(arg)
                    arg = ''
                }
                lastCharWasSpace = true
                continue
            } else {
                lastCharWasSpace = false
            }

            if (c === '"') {
                if (!escaped) {
                    inQuotes = !inQuotes
                } else {
                    append(c)
                }
                continue
            }

            if (c === '\\' && escaped) {
                append(c)
                continue
            }

            if (c === '\\' && inQuotes) {
                escaped = true
                continue
            }

            append(c)
            lastCharWasSpace = false
        }

        if (!lastCharWasSpace) {
            args.push(arg.trim())
        }

        return args
    }

    private toCamelCase(input: string): string {
        return input.replace(/^\w|[A-Z]|\b\w|\s+/g, function (match, index) {
            if (+match === 0) return '' // or if (/\s+/.test(match)) for white spaces
            return index === 0 ? match.toLowerCase() : match.toUpperCase()
        })
    }
}
