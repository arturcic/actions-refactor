/// <reference types="vite/client" />

import { IBuildAgent } from './models'

export async function getAgent(): Promise<IBuildAgent> {
    const agentType = import.meta.env.MODE
    console.log(`Agent Type loading: ${agentType}`)
    let agent: typeof import('@agents/azure') | typeof import('@agents/github') | typeof import('@agents/fake')
    if (agentType === 'azure') {
        agent = await import('@agents/azure')
    } else if (agentType === 'github') {
        agent = await import('@agents/github')
    } else {
        agent = await import('@agents/fake')
    }
    return new agent.BuildAgent()
}

export type { IExecResult, IBuildAgent } from './models'
