import { BuildAgentBase, IBuildAgent } from '@agents/common'
import { TaskCommand, TaskResult } from './task-command'

export class BuildAgent extends BuildAgentBase implements IBuildAgent {
    agentName = 'Azure Pipelines'

    sourceDirVariable = 'BUILD_SOURCESDIRECTORY'
    tempDirVariable = 'AGENT_TEMPDIRECTORY'
    cacheDirVariable = 'AGENT_TOOLSDIRECTORY'

    addPath(inputPath: string): void {
        super.addPath(inputPath)
        this._command('task.prependpath', null, inputPath)
    }

    info = (message: string): void => this.debug(message)

    debug = (message: string): void => this._command('task.debug', null, message)

    warning = (message: string): void => this._command('task.issue', { type: 'warning' }, message)

    error = (message: string): void => this._command('task.issue', { type: 'error' }, message)

    setSucceeded = (message: string, done?: boolean): void => this._setResult(TaskResult.Succeeded, message, done)

    setFailed = (message: string, done?: boolean): void => this._setResult(TaskResult.Failed, message, done)

    setOutput = (name: string, value: string): void => this._setVariable(name, value, true)

    setVariable = (name: string, value: string): void => this._setVariable(name, value)

    private _command(command: string, properties: Record<string, string> | null, message: string): void {
        const taskCmd = new TaskCommand(command, properties, message)
        console.log(taskCmd.toString())
    }

    private _setResult(result: TaskResult, message: string, done?: boolean): void {
        this.debug(`task result: ${TaskResult[result]}`)
        // add an error issue
        if (result === TaskResult.Failed && message) {
            this.error(message)
        } else if (result === TaskResult.SucceededWithIssues && message) {
            this.warning(message)
        }
        // task.complete
        const properties: Record<string, string> = { result: TaskResult[result] }
        if (done) {
            properties['done'] = 'true'
        }
        this._command('task.complete', properties, message)
    }

    private _setVariable(name: string, val: string, isOutput = false): void {
        const key: string = this._getVariableKey(name)
        const varValue = val || ''
        process.env[key] = varValue

        this._command(
            'task.setvariable',
            {
                variable: name || '',
                isOutput: (isOutput || false).toString(),
                issecret: 'false'
            },
            varValue
        )
    }

    private _getVariableKey(name: string): string {
        return name.replace(/\./g, '_').replace(/ /g, '_').toUpperCase()
    }
}
