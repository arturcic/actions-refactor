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

function escapeData(s: string): string {
    return s.replace(/%/g, '%AZP25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function escape(s: string): string {
    return s.replace(/%/g, '%AZP25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/]/g, '%5D').replace(/;/g, '%3B')
}
