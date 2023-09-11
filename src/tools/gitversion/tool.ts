import path from 'node:path';

import { DotnetTool, IBuildAgent } from '@tools/common';
import { GitVersionSettingsProvider, IGitVersionSettingsProvider } from './settings.ts';
import { GitVersionOutput, GitVersionSettings } from './models.ts';

export class GitVersionTool extends DotnetTool {

    constructor(buildAgent: IBuildAgent) {
        super(buildAgent);
    }

    public get toolName(): string {
        return 'GitVersion.Tool';
    }

    get settingsProvider(): IGitVersionSettingsProvider {
        return new GitVersionSettingsProvider(this.buildAgent);
    }

    async run() {
        const settings = this.settingsProvider.getGitVersionSettings();

        const workDir = this.getRepoDir(settings.targetPath)

        const args = this.getArguments(workDir, settings)

        const dotnetPath = this.buildAgent.getVariable('DOTNET_ROOT');
        const toolPath = path.join(dotnetPath, 'dotnet-gitversion');

        return this.execute(toolPath, args)
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
                throw new Error('Directory not found at ' + targetPath)
            }
        }
        return workDir.replace(/\\/g, '/')
    }

    private getArguments(workDir: string, options: GitVersionSettings): string[] {
        let args = [workDir, '/output', 'json', '/output', 'buildserver']

        const { useConfigFile, configFilePath, updateAssemblyInfo, updateAssemblyInfoFilename, additionalArguments } = options

        if (useConfigFile) {
            if (this.buildAgent.isValidInputFile('configFilePath', configFilePath)) {
                args.push('/config', configFilePath)
            } else {
                throw new Error('GitVersion configuration file not found at ' + configFilePath)
            }
        }
        if (updateAssemblyInfo) {
            args.push('/updateassemblyinfo')

            // You can specify 'updateAssemblyInfo' without 'updateAssemblyInfoFilename'.
            if (updateAssemblyInfoFilename?.length > 0) {
                if (this.buildAgent.isValidInputFile('updateAssemblyInfoFilename', updateAssemblyInfoFilename)) {
                    args.push(updateAssemblyInfoFilename)
                } else {
                    throw new Error('AssemblyInfoFilename file not found at ' + updateAssemblyInfoFilename)
                }
            }
        }

        if (additionalArguments) {
            args = args.concat(this.argStringToArray(additionalArguments))
        }
        return args
    }

    public writeGitVersionToAgent(gitversion: GitVersionOutput): void {
        let properties = Object.keys(gitversion)
        let gitversionOutput = <any>gitversion

        properties.forEach(property => {
            const name = this.toCamelCase(property)
            const value = gitversionOutput[property]
            this.buildAgent.setOutput(name, value)
            this.buildAgent.setOutput(`GitVersion_${name}`, value)
            this.buildAgent.setVariable(name, value)
            this.buildAgent.setVariable(`GitVersion_${name}`, value)
        })
    }

    private argStringToArray(argString: string): string[] {
        const args: string[] = [];

        let inQuotes = false;
        let escaped = false;
        let lastCharWasSpace = true;
        let arg = '';

        const append = function (c: string) {
            // we only escape double quotes.
            if (escaped && c !== '"') {
                arg += '\\';
            }

            arg += c;
            escaped = false;
        };

        for (let i = 0; i < argString.length; i++) {
            const c = argString.charAt(i);

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
            return index == 0 ? match.toLowerCase() : match.toUpperCase()
        })
    }
}