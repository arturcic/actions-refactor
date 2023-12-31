import { getAgent } from '@agents/common'
import { parseCliArgs } from '@tools/common'
import { GitVersionTool } from './tool'

const agent = await getAgent()

const gitVersionTool = new GitVersionTool(agent)

const { command } = parseCliArgs()
switch (command) {
    case 'setup':
        await setup()
        break
    case 'execute':
        await run()
}

async function setup(): Promise<void> {
    try {
        agent.info(`Running on: '${agent.agentName}'`)
        agent.debug('Disabling telemetry')
        gitVersionTool.disableTelemetry()

        agent.debug('Installing GitVersion')
        await gitVersionTool.install()
    } catch (error) {
        console.log(error)
    }
}

async function run(): Promise<void> {
    try {
        agent.debug(`Agent: '${agent.agentName}'`)
        agent.debug('Disabling telemetry')
        gitVersionTool.disableTelemetry()

        agent.debug('Executing GitVersion')
        const result = await gitVersionTool.run()

        if (result.code === 0) {
            agent.debug('GitVersion executed successfully')
            const { stdout } = result

            if (stdout.lastIndexOf('{') === -1 || stdout.lastIndexOf('}') === -1) {
                agent.debug('GitVersion output is not valid JSON')
                agent.setFailed('GitVersion output is not valid JSON', true)
                return
            } else {
                const jsonOutput = stdout.substring(stdout.lastIndexOf('{'), stdout.lastIndexOf('}') + 1)

                const gitVersionOutput = JSON.parse(jsonOutput)
                gitVersionTool.writeGitVersionToAgent(gitVersionOutput)
                agent.setSucceeded('GitVersion executed successfully', true)
            }
        } else {
            agent.debug('GitVersion failed')
            const error = result.error
            if (error instanceof Error) {
                agent.setFailed(error?.message, true)
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            agent.setFailed(error?.message, true)
        }
    }
}
