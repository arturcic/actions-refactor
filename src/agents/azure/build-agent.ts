import * as taskLib from 'azure-pipelines-task-lib/task'

import { BuildAgentBase, IBuildAgent } from '@agents/common'

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

    setSucceeded = (message: string, done?: boolean): void => taskLib.setResult(taskLib.TaskResult.Succeeded, message, done)

    setFailed = (message: string, done?: boolean): void => taskLib.setResult(taskLib.TaskResult.Failed, message, done)

    setOutput = (name: string, value: string): void => taskLib.setVariable(name, value, false, true)

    setVariable = (name: string, value: string): void => taskLib.setVariable(name, value)
}
