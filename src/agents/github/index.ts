import * as core from '@actions/core'
import * as exe from '@actions/exec'
import * as io from '@actions/io'
import { BuildAgentBase, IBuildAgent, IExecResult } from '@agents/common'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    get agentName(): string {
        return 'GitHub Actions'
    }

    addPath(inputPath: string): void {
        core.addPath(inputPath)
    }

    debug(message: string): void {
        core.debug(message)
    }

    info(message: string): void {
        core.info(message)
    }

    warn(message: string): void {
        core.warning(message)
    }

    error(message: string): void {
        core.error(message)
    }

    async exec(exec: string, args: string[]): Promise<IExecResult> {
        const dotnetPath = await io.which(exec, true)
        const { exitCode, stdout, stderr } = await exe.getExecOutput(`"${dotnetPath}"`, args)
        return {
            code: exitCode,
            error: null,
            stderr,
            stdout
        }
    }

    getSourceDir(): string {
        return this.getVariable('GITHUB_WORKSPACE')
    }

    getTempRootDir(): string {
        return this.getVariable('RUNNER_TEMP')
    }

    getCacheRootDir(): string {
        return this.getVariable('RUNNER_TOOL_CACHE')
    }

    setFailed(message: string, _: boolean): void {
        core.setFailed(message)
    }

    setOutput(name: string, value: string): void {
        core.setOutput(name, value)
    }

    setSucceeded(_message: string, _done?: boolean): void {
        //
    }

    setVariable(name: string, value: string): void {
        core.exportVariable(name, value)
    }

    async which(tool: string, check?: boolean): Promise<string> {
        return io.which(tool, check)
    }
}
