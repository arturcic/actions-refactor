import { IBuildAgent } from '@agents/common'
import { type Commands } from './models'
import { GitReleaseManagerTool } from './tool'

export class Runner {
    private readonly gitReleaseManagerTool: GitReleaseManagerTool

    constructor(private readonly buildAgent: IBuildAgent) {
        this.gitReleaseManagerTool = new GitReleaseManagerTool(this.buildAgent)
    }

    async run(command: Commands): Promise<number> {
        switch (command) {
            case 'setup':
                return await this.setup()
            case 'addasset':
                return await this.addAsset()
            case 'open':
                return await this.open()
            case 'close':
                return await this.close()
            case 'create':
                return await this.create()
            case 'discard':
                return await this.discard()
            case 'publish':
                return await this.publish()
        }
    }

    private async setup(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.install()

            this.buildAgent.setSucceeded('GitReleaseManager installed successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async create(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.create()

            this.buildAgent.setSucceeded('GitReleaseManager created release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async discard(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.discard()

            this.buildAgent.setSucceeded('GitReleaseManager discarded release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async close(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.close()

            this.buildAgent.setSucceeded('GitReleaseManager closed release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async open(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.open()

            this.buildAgent.setSucceeded('GitReleaseManager opened release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async publish(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.publish()

            this.buildAgent.setSucceeded('GitReleaseManager published release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }

    private async addAsset(): Promise<number> {
        try {
            this.gitReleaseManagerTool.disableTelemetry()

            await this.gitReleaseManagerTool.addAsset()

            this.buildAgent.setSucceeded('GitReleaseManager added assets to release successfully', true)
            return 0
        } catch (error) {
            if (error instanceof Error) {
                this.buildAgent.setFailed(error.message, true)
            }
            return -1
        }
    }
}
