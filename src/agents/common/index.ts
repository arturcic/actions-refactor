/// <reference types="vite/client" />

export interface IBuildAgent {
    agentName: string;
}
export type Agent = typeof import('@agents/azure') | typeof import('@agents/github');

export async function getAgent(): Promise<IBuildAgent> {
    const agentType = import.meta.env.MODE;
    console.log('Agent Type: ' + agentType);
    let agent: Agent;
    if (agentType === 'azure') {
        agent = await import('@agents/azure');
    } else /*if (mode === 'github')*/ {
        agent = await import('@agents/github');
    }
    return agent.BuildAgent;
}