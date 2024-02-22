import * as path from 'node:path'
import * as process from 'node:process'
import * as util from 'node:util'
import { exec as execNonPromise } from 'node:child_process'

import { BuildAgentBase, IBuildAgent, IExecResult } from '@agents/common'

import { lookPath } from './internal/lookPath'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    agentName = 'Local'

    sourceDirVariable = 'AGENT_SOURCE_DIR'
    tempDirVariable = 'AGENT_TEMP_DIR'
    cacheDirVariable = 'AGENT_TOOLS_DIR'

    debug = (message: string): void => console.log(`[debug] ${message}`)

    info = (message: string): void => console.log(`[info] - ${message}`)

    warn = (message: string): void => console.warn(`[warn] - ${message}`)

    error = (message: string): void => console.error(`[error] - ${message}`)

    async exec(cmd: string, args: string[]): Promise<IExecResult> {
        const exec = util.promisify(execNonPromise)

        try {
            const { stdout, stderr } = await exec(`${cmd} ${args.join(' ')}`)
            return {
                code: 0,
                error: null,
                stderr,
                stdout
            }
        } catch (e) {
            const error = e as Error & { code: number; stderr: string; stdout: string }
            return {
                code: error.code,
                error,
                stderr: error.stderr,
                stdout: error.stdout
            }
        }
    }

    setFailed = (message: string, done?: boolean): void => this.error(`setFailed - ${message} - ${done}`)

    setOutput = (name: string, value: string): void => this.debug(`setOutput - ${name} - ${value}`)

    setSucceeded = (message: string, done?: boolean): void => this.info(`setSucceeded - ${message} - ${done}`)

    setVariable(name: string, value: string): void {
        this.debug(`setVariable - ${name} - ${value}`)
        process.env[name] = value
    }

    async which(tool: string, _check?: boolean): Promise<string> {
        this.debug(`looking for tool '${tool}' in PATH`)
        let toolPath = await lookPath(tool)
        if (toolPath) {
            toolPath = path.resolve(toolPath)
            this.debug(`found tool '${tool}' in PATH: ${toolPath}`)
            return toolPath
        }
        throw new Error(`Unable to locate executable file: ${tool}`)
    }
}
