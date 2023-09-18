import * as taskLib from 'azure-pipelines-task-lib/task'
import * as toolLib from 'azure-pipelines-tool-lib/tool'

import { IBuildAgent, IExecResult } from '@tools/common'

export class BuildAgent implements IBuildAgent {
    get agentName(): string {
        return 'Azure Pipelines'
    }

    addPath(inputPath: string): void {
        toolLib.prependPath(inputPath)
    }

    debug(message: string): void {
        taskLib.debug(message)
    }

    info(message: string): void {
        taskLib.debug(message)
    }

    warn(message: string): void {
        taskLib.warning(message)
    }

    error(message: string): void {
        taskLib.error(message)
    }

    async exec(exec: string, args: string[]): Promise<IExecResult> {
        const tr = taskLib.tool(exec)
        tr.arg(args)

        const result = tr.execSync()
        return Promise.resolve({
            code: result.code,
            error: result.error,
            stderr: result.stderr,
            stdout: result.stdout
        })
    }

    async cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        return toolLib.cacheDir(sourceDir, tool, version, arch)
    }

    dirExists(file: string): boolean {
        return taskLib.exist(file) && taskLib.stats(file).isDirectory()
    }

    fileExists(file: string): boolean {
        return taskLib.exist(file) && taskLib.stats(file).isFile()
    }

    findLocalTool(toolName: string, versionSpec: string, arch?: string): string | null {
        return toolLib.findLocalTool(toolName, versionSpec, arch)
    }

    getSourceDir(): string | undefined {
        return this.getVariable('Build.SourcesDirectory')
    }

    getTempRootDir(): string | undefined {
        return this.getVariable('Agent.TempDirectory')
    }

    getCacheRootDir(): string | undefined {
        return this.getVariable('Agent.ToolsDirectory')
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        return taskLib.getBoolInput(input, required)
    }

    getInput(input: string, required?: boolean): string {
        return taskLib.getInput(input, required)?.trim() ?? ''
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split('\n')
            .filter(x => x !== '')
    }

    setFailed(message: string, done?: boolean): void {
        taskLib.setResult(taskLib.TaskResult.Failed, message, done)
    }

    setOutput(name: string, value: string): void {
        taskLib.setVariable(name, value, false, true)
    }

    setSucceeded(message: string, done?: boolean): void {
        taskLib.setResult(taskLib.TaskResult.Succeeded, message, done)
    }

    getVariable(name: string): string | undefined {
        return taskLib.getVariable(name)
    }

    setVariable(name: string, value: string): void {
        taskLib.setVariable(name, value)
    }

    async which(tool: string, check?: boolean): Promise<string> {
        return Promise.resolve(taskLib.which(tool, check))
    }
}
