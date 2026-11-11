/**
 * Build the dazi-bot package on the workspace's Client face: the shared client
 * preset emits the browser half as a client-module row while the Host face
 * builds the plugin modules from `lib/types`. A plain build outside the
 * workspace face emits only those Host modules.
 */
import { clientBundle } from '../../client/tsdown.client.ts'
import { defineConfig } from 'tsdown'

const workspace = clientBundle(import.meta.dirname, ['lib/types/index.js'])

export default defineConfig((context) => {
  if (context.env?.DSH_BUILD_FACE === 'client') return workspace(context)
  return {
    entry: ['lib/types/index.js'],
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: false,
    clean: false,
    sourcemap: false,
    fixedExtension: false,
    external: [/^@deepseek-ai\//, /^@dazi\//, /^node:/],
  }
})
