import * as process from 'node:process'

import { BuildAgentBase, IBuildAgent } from '@agents/common'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    agentName = 'Local'

    sourceDirVariable = 'AGENT_SOURCE_DIR'
    tempDirVariable = 'AGENT_TEMP_DIR'
    cacheDirVariable = 'AGENT_TOOLS_DIR'

    debug = (message: string): void => console.debug(`[debug] ${message}`)

    info = (message: string): void => console.log(`[info] - ${message}`)

    warn = (message: string): void => console.warn(`[warn] - ${message}`)

    error = (message: string): void => console.error(`[error] - ${message}`)

    setSucceeded = (message: string, done?: boolean): void => this.info(`setSucceeded - ${message} - ${done}`)

    setFailed = (message: string, done?: boolean): void => this.error(`setFailed - ${message} - ${done}`)

    setOutput = (name: string, value: string): void => this.debug(`setOutput - ${name} - ${value}`)

    setVariable(name: string, value: string): void {
        this.debug(`setVariable - ${name} - ${value}`)
        process.env[name] = value
    }
}
