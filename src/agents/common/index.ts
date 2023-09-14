/// <reference types="vite/client" />
import { IBuildAgent } from '@tools/common'

export type Agent = typeof import('@agents/azure') | typeof import('@agents/github')

export async function getAgent(): Promise<IBuildAgent> {
    const agentType = import.meta.env.MODE
    console.log(`Agent Type: ${agentType}`)
    let agent: Agent
    switch (agentType) {
        case 'azure':
            agent = await import('@agents/azure')
            break
        case 'github':
            agent = await import('@agents/github')
            break
        default:
            agent = await import('@agents/fake')
            break
    }
    return new agent.BuildAgent()
}
