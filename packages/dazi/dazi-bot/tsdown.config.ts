/**
 * Build the dazi-bot bundle as a self-contained npm package: plain ESM with
 * declarations, no project references, so the packaged tarball needs only
 * Cordis and the MCP manager from the host it is installed into.
 */
import { defineConfig } from 'tsdown'

/** One build per entry, so each module lands at `<name>.js` beside its declarations. */
export default defineConfig(['index', 'connectors'].map(name => ({
  entry: [`${name}.ts`],
  outDir: '.',
  format: 'esm' as const,
  platform: 'node' as const,
  dts: { sourcemap: false },
  clean: false,
  fixedExtension: false,
  external: [/^@deepseek-ai\//, /^node:/],
})))