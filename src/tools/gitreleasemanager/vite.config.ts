import defineConfig from '../../vite.config.ts';
import { UserConfig } from 'vite';

export default ({ mode }: Partial<UserConfig>) => defineConfig(mode as string,'gitreleasemanager')
