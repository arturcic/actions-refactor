import { resolve } from 'path'
import { UserConfig } from 'vite'
import { viteConfig } from './vite.common.config'

const config = (): UserConfig => {
    const tools = ['gitversion', 'gitreleasemanager']
        .map(tool => ({
            [`tools/${tool}`]: resolve(__dirname, `tools/${tool}/main.ts`)
        }))
        .reduce((acc, cur) => ({ ...acc, ...cur }), {})

    const entry = {
        ...tools
    }

    const manualChunks = (id: string): string | undefined => {
        // console.log(`id: ${id}`)
        if (id.includes('tools/common')) {
            return `common/tools`
        }
        if (id.includes('agents/common')) {
            return `common/agents`
        }
        if (id.includes('node_modules/semver') || id.includes('node_modules/lru-cache') || id.includes('node_modules/yallist')) {
            return `common/semver`
        }
    }

    return viteConfig(entry, manualChunks)
}

export default config
