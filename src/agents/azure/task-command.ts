//
// Command Format:
//    ##vso[artifact.command key=value;key=value]user message
//
// Examples:
//    ##vso[task.progress value=58]
//    ##vso[task.issue type=warning;]This is the user warning message
//
const CMD_PREFIX = '##vso['

export enum TaskResult {
    Succeeded = 0,
    SucceededWithIssues = 1,
    Failed = 2,
    Cancelled = 3,
    Skipped = 4
}

export class TaskCommand {
    constructor(
        private readonly command: string,
        private properties: Record<string, string> | null,
        private message: string
    ) {
        if (!command) {
            this.command = 'missing.command'
        }
    }

    toString(): string {
        let cmdStr = CMD_PREFIX + this.command

        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' '
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key]
                    if (val) {
                        // safely append the val - avoid blowing up when attempting to
                        // call .replace() if message is not a string for some reason
                        cmdStr += `${key}=${escape(`${val || ''}`)};`
                    }
                }
            }
        }

        cmdStr += ']'

        // safely append the message - avoid blowing up when attempting to
        // call .replace() if message is not a string for some reason
        const message = `${this.message || ''}`
        cmdStr += escapeData(message)

        return cmdStr
    }
}

export function commandFromString(commandLine: string): TaskCommand {
    const lbPos = commandLine.indexOf('[')
    const rbPos = commandLine.indexOf(']')
    if (lbPos === -1 || rbPos === -1 || rbPos - lbPos < 3) {
        throw new Error('Invalid command brackets')
    }
    const cmdInfo = commandLine.substring(lbPos + 1, rbPos)
    const spaceIdx = cmdInfo.indexOf(' ')

    let command = cmdInfo
    const properties: { [key: string]: string } = {}

    if (spaceIdx > 0) {
        command = cmdInfo.trim().substring(0, spaceIdx)
        const propSection = cmdInfo.trim().substring(spaceIdx + 1)

        const propLines: string[] = propSection.split(';')
        for (let propLine of propLines) {
            propLine = propLine.trim()
            if (propLine.length > 0) {
                const eqIndex = propLine.indexOf('=')
                if (eqIndex === -1) {
                    throw new Error(`Invalid property: ${propLine}`)
                }

                const key: string = propLine.substring(0, eqIndex)
                const val: string = propLine.substring(eqIndex + 1)

                properties[key] = unescape(val)
            }
        }
    }

    const msg: string = unEscapeData(commandLine.substring(rbPos + 1))
    return new TaskCommand(command, properties, msg)
}

function escapeData(s: string): string {
    return s.replace(/%/g, '%AZP25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function unEscapeData(s: string): string {
    return s
        .replace(/%0D/g, '\r')
        .replace(/%0A/g, '\n')
        .replace(/%AZP25/g, '%')
}

function escape(s: string): string {
    return s.replace(/%/g, '%AZP25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/]/g, '%5D').replace(/;/g, '%3B')
}

function unescape(s: string): string {
    return s
        .replace(/%0D/g, '\r')
        .replace(/%0A/g, '\n')
        .replace(/%5D/g, ']')
        .replace(/%3B/g, ';')
        .replace(/%AZP25/g, '%')
}
