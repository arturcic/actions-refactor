/// <reference types="vite/client" />
export type Agent = typeof import('@agents/azure') | typeof import('@agents/github');

export async function getAgent(): Promise<Agent> {
    const mode = import.meta.env.MODE;
    console.log('Mode: ' + mode);
    if (mode === 'azure') {
        return await import('@agents/azure');
    } else /*if (mode === 'github')*/ {
        return await import('@agents/github');
    }
}