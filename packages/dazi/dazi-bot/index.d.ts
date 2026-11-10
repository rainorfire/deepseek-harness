import Schema from '@deepseek-ai/schemastery'
import { Context } from '@deepseek-ai/cordis'

//#region connectors.d.ts
/** Transport a connector starts as an MCP server. */
type ConnectorTransport = {
  kind: 'remote-mcp'
  url: string
  timeout?: number
} | {
  kind: 'cli-bridge'
  detect?: string
  bridge?: string
} | {
  kind: 'local-mcp'
  command: string
  args?: string[]
  env?: Record<string, string>
}
/** One catalog entry, limited to the fields this package acts on. */
interface CatalogItem {
  slug: string
  name: string
  name_en?: string
  description?: string
  category?: string
  transport: ConnectorTransport
  auth?: {
    type: 'oauth' | 'api-key' | 'none'
    note?: string
  }
  source?: string
  icon?: string | null
  examples?: string[]
  applyUrl?: string
  applyHint?: string
  /** Kernel-direct exposure limits the catalog may declare; applied as `enabledTools`. */
  codexDirect?: {
    startupTimeoutSec?: number
    enabledTools?: string[]
  }
}
/** One connector installed through WorkDazi. */
interface StoredInstance {
  id: string
  slug: string
  displayName?: string
  state?: string
  defaultEnabled?: boolean
  lastError?: string
}
/** Catalog paired with install state, as presented to the user. */
interface CatalogListing {
  item: CatalogItem
  installed: boolean
  /** State of the installed instance, when there is one. */
  state?: string
  lastError?: string
}
//#endregion
//#region index.d.ts
/** One installed connector with its run state. */
interface DaziConnectorView {
  /** Instance id; unique across installed connectors. */
  id: string
  /** Catalog slug; also the tool namespace, `mcp__<slug>__<tool>`. */
  slug: string
  /** Display name. */
  name: string
  /** Catalog category. */
  category: string
  /** Transport kind of the catalog entry. */
  kind: 'remote-mcp' | 'cli-bridge' | 'local-mcp'
  /** Whether the installed instance is enabled in WorkDazi. */
  enabled: boolean
  /** Whether this host runs the connector. */
  ready: boolean
  /** Why the connector is not running, when it is not. */
  reason?: string
}
/** Snapshot returned to clients. */
interface DaziConnectorsView {
  /** Installed connectors with run state. */
  installed: DaziConnectorView[]
  /** Why remote connectors cannot start, when they cannot. */
  remoteError?: string
}
/** Plugin configuration. */
interface Config {
  /** Path of WorkDazi's connector catalog. */
  catalogPath?: string
  /** Path of WorkDazi's settings store. */
  storePath?: string
  /** Path of the control endpoint descriptor. */
  gatewayPath?: string
  /** Node executable for CLI bridges and local servers; defaults to the host's. */
  nodePath?: string
  /** Run every installed connector, whatever WorkDazi's enable switches say. */
  ignoreEnableState?: boolean
}
declare const name = 'dazi-bot-connectors'
declare const inject: string[]
declare const Config: Schema<Config>
/**
 * Start each catalog connector as an MCP server and publish the connector view.
 * @param ctx - plugin context; `mcpManager` is ready when this runs.
 * @param config - validated plugin configuration.
 */
declare function apply(ctx: Context, config: Config): void
declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * The connector catalog or run state changed.
     * @mode parallel
     */
    'dazi-bot/connectors-changed'(): void | Promise<void>
  }
}
//#endregion
export { type CatalogItem, type CatalogListing, Config, type ConnectorTransport, DaziConnectorView, DaziConnectorsView, type StoredInstance, apply, inject, name }
