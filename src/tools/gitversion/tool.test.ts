import { describe, expect, it } from 'vitest'
import { GitVersionTool } from './tool'
import { IBuildAgent } from '@agents/common'

describe('GitVersionTool', () => {
    it('should return correct tool name', () => {
        const tool = new GitVersionTool({} as IBuildAgent)
        expect(tool.toolName).toBe('GitVersion.Tool')
    })
})
