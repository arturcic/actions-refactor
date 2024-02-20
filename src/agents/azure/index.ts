import * as taskLib from 'azure-pipelines-task-lib/task'
import * as toolLib from 'azure-pipelines-tool-lib/tool'

import { BuildAgentBase, IBuildAgent, IExecResult } from '@agents/common'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
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

    getSourceDir(): string | undefined {
        return this.getVariable('Build.SourcesDirectory')
    }

    getTempRootDir(): string | undefined {
        return this.getVariable('Agent.TempDirectory')
    }

    getCacheRootDir(): string | undefined {
        return this.getVariable('Agent.ToolsDirectory')
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

    setVariable(name: string, value: string): void {
        taskLib.setVariable(name, value)
    }

    async which(tool: string, check?: boolean): Promise<string> {
        return Promise.resolve(taskLib.which(tool, check))
    }
}
