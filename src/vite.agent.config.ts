import { resolve } from 'path'
import { loadEnv, UserConfig } from 'vite'
import { viteConfig } from './vite.common.config'

const config = ({ mode: agent }: Partial<UserConfig>): UserConfig => {
    console.log(`Building for agent: ${agent}`)

    if (agent != null) {
        process.env = { ...process.env, ...loadEnv(agent, process.cwd()) }
    }

    const entry = {
        [`agents/${agent}/buildAgent`]: resolve(__dirname, `agents/${agent}/buildAgent.ts`)
    }

    const manualChunks = (id: string): string | undefined => {
        // console.log(`id: ${id}`)
        if (id.includes('node_modules')) {
            return `agents/${agent}/vendor`
        }
    }

    return viteConfig(entry, manualChunks)
}

export default config
