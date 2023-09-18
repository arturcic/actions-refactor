import { DotnetTool, IExecResult } from '@tools/common'
import { GitVersionSettingsProvider, IGitVersionSettingsProvider } from './settings'
import { GitVersionOutput, GitVersionSettings } from './models'

export class GitVersionTool extends DotnetTool {
    get toolName(): string {
        return 'GitVersion.Tool'
    }

    get settingsProvider(): IGitVersionSettingsProvider {
        return new GitVersionSettingsProvider(this.buildAgent)
    }

    async run(): Promise<IExecResult> {
        const settings = this.settingsProvider.getGitVersionSettings()
        const workDir = this.getRepoDir(settings.targetPath)
        const args = this.getArguments(workDir, settings)

        await this.setDotnetRoot()

        const toolPath = await this.buildAgent.which('dotnet-gitversion', true)
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
                this.buildAgent.setOutput(`GitVersion_${name}`, value)
                this.buildAgent.setVariable(name, value)
                this.buildAgent.setVariable(`GitVersion_${name}`, value)
            } catch (error) {
                this.buildAgent.error(`Unable to set output/variable for ${name}`)
            }
        }
    }

    private getRepoDir(targetPath: string): string {
        let workDir: string
        const srcDir = this.buildAgent.getSourceDir() || '.'
        if (!targetPath) {
            workDir = srcDir
        } else {
            if (this.buildAgent.dirExists(targetPath)) {
                workDir = targetPath
            } else {
                throw new Error(`Directory not found at ${targetPath}`)
            }
        }
        return workDir.replace(/\\/g, '/')
    }

    private getArguments(workDir: string, options: GitVersionSettings): string[] {
        let args = [workDir, '/output', 'json', '/output', 'buildserver']

        const { useConfigFile, configFilePath, updateAssemblyInfo, updateAssemblyInfoFilename, additionalArguments } = options

        if (useConfigFile) {
            if (this.isValidInputFile('configFilePath', configFilePath)) {
                args.push('/config', configFilePath)
            } else {
                throw new Error(`GitVersion configuration file not found at ${configFilePath}`)
            }
        }
        if (updateAssemblyInfo) {
            args.push('/updateassemblyinfo')

            // You can specify 'updateAssemblyInfo' without 'updateAssemblyInfoFilename'.
            if (updateAssemblyInfoFilename?.length > 0) {
                if (this.isValidInputFile('updateAssemblyInfoFilename', updateAssemblyInfoFilename)) {
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
