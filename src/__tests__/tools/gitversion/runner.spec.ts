import { describe, it } from 'vitest'
import { Runner } from '@tools/gitversion'
import { BuildAgent } from '@agents/local'

describe('GitVersion Runner', () => {
    it('should run GitVersion', async () => {
        const agent = new BuildAgent()
        const runner = new Runner(agent)
        await runner.execute('setup')
    })
})
