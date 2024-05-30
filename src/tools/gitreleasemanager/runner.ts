import { IBuildAgent } from '@agents/common'
import { type Commands } from './models'

export class Runner {
    constructor(private readonly agent: IBuildAgent) {}

    async execute(command: Commands): Promise<void> {
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
