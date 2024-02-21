import { getAgent, IBuildAgent } from '@agents/common'
import { parseCliArgs } from '@tools/common'

export class Runner {
    private agent!: IBuildAgent

    async execute(): Promise<void> {
        const { command, buildAgent } = parseCliArgs()

        this.agent = await getAgent(buildAgent)

        switch (command) {
            case 'setup':
                await this.setup()
                break
        }
    }

    private async setup(): Promise<void> {
        try {
            this.agent.info(`Running on: '${this.agent.agentName}'`)
            this.agent.debug('Disabling telemetry')
        } catch (error) {
            console.log(error)
        }
    }
}
