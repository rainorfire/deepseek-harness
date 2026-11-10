//#region connectors.d.ts
/**
 * Connector model and the sources it is discovered from.
 *
 * WorkDazi's app explores a connector catalog, lets the user install items, and
 * starts the installed ones as MCP servers. This package performs the same
 * exploration from the state WorkDazi leaves on disk, so dazi-bot and WorkDazi
 * share one catalog and one set of installed connectors instead of each
 * provisioning its own.
 *
 * - Catalog: the WorkDazi application's `connectors/catalog/index.json` plus the
 *   user's custom entries in its settings.
 * - Instances: the user's installs in WorkDazi's settings (electron-store).
 * - Remote credentials: decrypted by the WorkDazi app on its localhost control
 *   endpoint; this process never reads the encrypted values itself.
 *
 * @module @dazi/dsh-dazi-bot/connectors
 */
/** WorkDazi's shared state directory. */
declare const DAZI_HOME: string
/** Control endpoint descriptor written by the WorkDazi app. */
declare const GATEWAY_PATH: string
/** WorkDazi's electron-store file, which holds settings and connector instances. */
declare const DAZI_STORE_PATH: string
/** Connector catalog shipped inside the WorkDazi application. */
declare const DEFAULT_CATALOG_PATH = '/Applications/WorkDazi.app/Contents/Resources/connectors/catalog/index.json'
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
/** Control endpoint descriptor. */
interface GatewayDescriptor {
  controlUrl: string
  controlToken?: string
  nodeDir?: string
}
/** A remote instance as WorkDazi's control endpoint enables it, with its decrypted credential. */
interface EnabledRemoteInstance {
  id: string
  slug: string
  url: string
  timeoutMs?: number
  headers?: Record<string, string>
}
/** Catalog paired with install state, as presented to the user. */
interface CatalogListing {
  item: CatalogItem
  installed: boolean
  /** State of the installed instance, when there is one. */
  state?: string
  lastError?: string
}
/** Read the control endpoint recorded by the WorkDazi app. */
declare function readGateway(path?: string): GatewayDescriptor | undefined
/**
 * Ask the WorkDazi control endpoint for the remote instances it enables. This
 * is the only path to remote credentials: the WorkDazi app decrypts them.
 * @param gateway - descriptor from {@link readGateway}.
 * @param timeoutMs - budget for the request.
 * @returns enabled remote instances with their headers.
 * @throws when the endpoint is unreachable or refuses the token.
 */
declare function fetchEnabledRemoteInstances(gateway: GatewayDescriptor, timeoutMs?: number): Promise<EnabledRemoteInstance[]>
/** Read the connector catalog WorkDazi explores: the bundled index plus custom entries. */
declare function readCatalog(path?: string, storePath?: string): CatalogItem[]
/** Read the connectors the user installed through WorkDazi, in install order. */
declare function readInstances(storePath?: string): StoredInstance[]
/** Whether an installed instance is enabled: ready, and either default-enabled or named by a session set. */
declare function isEnabled(instance: StoredInstance, sessionIds: ReadonlySet<string>): boolean
/** Session-level enable sets from WorkDazi's settings, flattened to instance ids. */
declare function readSessionEnabledIds(storePath?: string): Set<string>
/** Pair the catalog with WorkDazi's install state. */
declare function listCatalog(instances: readonly StoredInstance[], catalog: readonly CatalogItem[]): CatalogListing[]
/** Expand a leading `~` to the home directory. */
declare function expandHome(command: string): string
//#endregion
export { CatalogItem, CatalogListing, ConnectorTransport, DAZI_HOME, DAZI_STORE_PATH, DEFAULT_CATALOG_PATH, EnabledRemoteInstance, GATEWAY_PATH, GatewayDescriptor, StoredInstance, expandHome, fetchEnabledRemoteInstances, isEnabled, listCatalog, readCatalog, readGateway, readInstances, readSessionEnabledIds }
