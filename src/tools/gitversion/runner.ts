import { IBuildAgent } from '@agents/common'
import { GitVersionTool } from './tool'
import { Commands } from './models'

export class Runner {
    private readonly gitVersionTool: GitVersionTool

    constructor(private readonly agent: IBuildAgent) {
        this.gitVersionTool = new GitVersionTool(this.agent)
    }

    async run(command: Commands): Promise<number> {
        switch (command) {
            case 'setup':
                return await this.setup()
            case 'execute':
                return await this.execute()
        }
    }

    private async setup(): Promise<number> {
        try {
            this.agent.info(`Running on: '${this.agent.agentName}'`)
            this.agent.debug('Disabling telemetry')
            this.gitVersionTool.disableTelemetry()

            this.agent.debug('Installing GitVersion')
            await this.gitVersionTool.install()
            return 0
        } catch (error) {
            console.log(error)
            if (error instanceof Error) {
                this.agent.setFailed(error?.message, true)
            }
            return -1
        }
    }

    private async execute(): Promise<number> {
        try {
            this.agent.debug(`Agent: '${this.agent.agentName}'`)
            this.agent.debug('Disabling telemetry')
            this.gitVersionTool.disableTelemetry()

            this.agent.debug('Executing GitVersion')
            const result = await this.gitVersionTool.run()

            if (result.code === 0) {
                this.agent.debug('GitVersion executed successfully')
                const { stdout } = result

                if (stdout.lastIndexOf('{') === -1 || stdout.lastIndexOf('}') === -1) {
                    this.agent.debug('GitVersion output is not valid JSON')
                    this.agent.setFailed('GitVersion output is not valid JSON', true)
                    return -1
                } else {
                    const jsonOutput = stdout.substring(stdout.lastIndexOf('{'), stdout.lastIndexOf('}') + 1)

                    const gitVersionOutput = JSON.parse(jsonOutput)
                    this.gitVersionTool.writeGitVersionToAgent(gitVersionOutput)
                    this.agent.setSucceeded('GitVersion executed successfully', true)
                    return 0
                }
            } else {
                this.agent.debug('GitVersion failed')
                const error = result.error
                if (error instanceof Error) {
                    this.agent.setFailed(error?.message, true)
                }
                return -1
            }
        } catch (error) {
            if (error instanceof Error) {
                this.agent.setFailed(error?.message, true)
            }
            return -1
        }
    }
}
