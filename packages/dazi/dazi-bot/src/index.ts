/**
 * Registers the MCP servers WorkDazi installs as managed servers: each
 * connector runs as a stdio server owned by this plugin's effect, so unloading
 * or disabling the plugin withdraws its tools.
 *
 * @module @dazi/dsh-dazi-bot
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-mcp-manager'
import Schema from '@deepseek-ai/schemastery'

/** One connector's MCP server entry. */
export interface ConnectorConfig {
  /** Unique tool namespace; tools surface as `mcp__<serverName>__<tool>`. */
  serverName: string
  /** Path to the connector's entry module, relative to the connector's package root. */
  entry: string
  /** Connector package root; defaults to the app's resource directory for `serverName`. */
  root?: string
}

/** Plugin configuration. */
export interface Config {
  /** Node executable that runs each connector; defaults to the host process's `execPath`. */
  nodePath?: string
  /** Directory holding the installed WorkDazi connectors; defaults to the macOS application resources. */
  appResourcesDir?: string
  /** Servers to register. */
  connectors: ConnectorConfig[]
}

const DEFAULT_APP_RESOURCES = '/Applications/WorkDazi.app/Contents/Resources'

/** Connector entries announced by WorkDazi's application resources. */
export const defaultConnectors: ConnectorConfig[] = [
  { serverName: 'workdazi-core', entry: 'workdazi-core-mcp/index.mjs' },
  { serverName: 'workdazi-growth', entry: 'workdazi-growth-mcp/index.mjs' },
  { serverName: 'workdazi-ledger', entry: 'workdazi-ledger-mcp/index.mjs' },
  { serverName: 'workdazi-scheduler', entry: 'workdazi-scheduler-mcp/index.mjs' },
  { serverName: 'workdazi-canvas', entry: 'workdazi-canvas-mcp/index.mjs' },
  { serverName: 'workdazi-human-gate', entry: 'workdazi-human-gate-mcp/index.mjs' },
  { serverName: 'workdazi-skills', entry: 'workdazi-skills-mcp/index.mjs' },
  { serverName: 'workdazi-connectors', entry: 'workdazi-connectors-mcp/index.mjs' },
]

export const name = 'dazi-bot-connectors'
export const inject = ['mcpManager']

export const Config: Schema<Config> = Schema.object({
  nodePath: Schema.string().default(process.execPath),
  appResourcesDir: Schema.string().default(DEFAULT_APP_RESOURCES),
  connectors: Schema.array(Schema.object({
    serverName: Schema.string().pattern(/^[A-Za-z0-9_-]{1,32}$/).required(),
    entry: Schema.string().required(),
    root: Schema.string(),
  })).default(defaultConnectors),
})

/**
 * Register each configured connector with the MCP server manager.
 * @param ctx - plugin context; `mcpManager` is ready when this runs.
 * @param config - validated plugin configuration.
 */
export function apply(ctx: Context, config: Config): void {
  for (const connector of config.connectors) {
    const root = connector.root ?? config.appResourcesDir ?? DEFAULT_APP_RESOURCES
    const entry = join(root, connector.entry)
    if (!existsSync(entry)) {
      ctx.logger('dazi-bot').warn('connector entry missing, skipped: %s', entry)
      continue
    }
    ctx.mcpManager.register(connector.serverName, {
      transport: 'stdio',
      command: config.nodePath ?? process.execPath,
      args: [entry],
      cwd: homedir(),
    })
  }
}
