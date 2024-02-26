import * as core from '@actions/core'
import { BuildAgentBase, IBuildAgent } from '@agents/common'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    agentName = 'GitHub Actions'

    sourceDirVariable = 'GITHUB_WORKSPACE'
    tempDirVariable = 'RUNNER_TEMP'
    cacheDirVariable = 'RUNNER_TOOL_CACHE'

    addPath(inputPath: string): void {
        super.addPath(inputPath)
        return core.addPath(inputPath)
    }

    debug = (message: string): void => core.debug(message)

    info = (message: string): void => core.info(message)

    error = (message: string): void => core.error(message)

    setSucceeded(_message: string, _done?: boolean): void {
        //
    }

    setFailed = (message: string, _: boolean): void => core.setFailed(message)

    setOutput = (name: string, value: string): void => core.setOutput(name, value)

    setVariable = (name: string, value: string): void => core.exportVariable(name, value)
}
