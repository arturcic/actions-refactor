import * as taskLib from 'azure-pipelines-task-lib/task'

import { BuildAgentBase, IBuildAgent, IExecResult } from '@agents/common'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    agentName = 'Azure Pipelines'

    sourceDirVariable = 'BUILD_SOURCESDIRECTORY'
    tempDirVariable = 'AGENT_TEMPDIRECTORY'
    cacheDirVariable = 'AGENT_TOOLSDIRECTORY'

    addPath(inputPath: string): void {
        super.addPath(inputPath)
        console.log(`##vso[task.prependpath]${inputPath}`)
    }

    debug = (message: string): void => taskLib.debug(message)

    info = (message: string): void => taskLib.debug(message)

    error = (message: string): void => taskLib.error(message)

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

    setSucceeded = (message: string, done?: boolean): void => taskLib.setResult(taskLib.TaskResult.Succeeded, message, done)

    setFailed = (message: string, done?: boolean): void => taskLib.setResult(taskLib.TaskResult.Failed, message, done)

    setOutput = (name: string, value: string): void => taskLib.setVariable(name, value, false, true)

    setVariable = (name: string, value: string): void => taskLib.setVariable(name, value)
}
