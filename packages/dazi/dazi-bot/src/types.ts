/** Remote boundary types of the connector exploration endpoint. */


/** What the panel reads from the catalog. */
export interface ConnectorCatalogRow {
  /** Stable catalog slug; the tool namespace is `mcp__<slug>__<tool>`. */
  readonly slug: string
  /** Display name. */
  readonly name: string
  /** One-line description. */
  readonly description: string
  /** Catalog category, used for grouping. */
  readonly category: string
  /** `remote-mcp`, `cli-bridge`, or `local-mcp`. */
  readonly kind: string
  /** Name of the bundled skill, when the catalog attaches one. */
  readonly skill: string
  /** Whether the user installed it through WorkDazi. */
  readonly installed: boolean
  /** WorkDazi's state for the installed instance, when there is one. */
  readonly state: string
  /** Why the installed connector is not running. */
  readonly lastError: string
}

/** One custom connector the user adds from the explore panel. */
export interface ConnectorDraft {
  /** Display name; its slug becomes the tool namespace. */
  readonly name: string
  /** `remote-mcp` for an HTTP endpoint, `local-mcp` for a stdio command. */
  readonly kind: string
  /** Remote endpoint URL, or the local server's executable. */
  readonly endpoint: string
  /** Additional arguments for a local server. */
  readonly args: readonly string[]
  /** Remote bearer token; stored in this home's credential store, never in the catalog. */
  readonly token: string
  /** One-line description. */
  readonly description: string
}

/** Everything the explore panel renders in one read. */
export interface ConnectorExploration {
  /** The connector catalog. */
  readonly catalog: readonly ConnectorCatalogRow[]
  /** Installed connectors with run state. */
  readonly installed: readonly DaziConnectorView[]
  /** Why remote connectors cannot start, when they cannot. */
  readonly remoteError: string
  /** Whether WorkDazi's own connector state was found on this host. */
  readonly workdaziFound: boolean
}


/** Connector types shared by the plugin body, its Remote controller, and the clients that read them. */

import type { CatalogItem, CatalogListing } from './connectors.js'

/** One installed connector with its run state. */
export interface DaziConnectorView {
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
  reason: string
}

/** Snapshot returned to clients. */
export interface DaziConnectorsView {
  /** Installed connectors with run state. */
  installed: DaziConnectorView[]
  /** Why remote connectors cannot start, when they cannot. */
  remoteError?: string
}

/** State the connector plugin hands its Remote controller. */
export interface DaziConnectorsHost {
  /** Re-read WorkDazi's control endpoint and reconcile servers. */
  refresh(): Promise<void>
  /** Connector catalog discovered from WorkDazi. */
  catalog(): readonly CatalogItem[]
  /** Installed connectors with run state. */
  describe(): DaziConnectorView[]
  /** Catalog with WorkDazi's install state. */
  list(): CatalogListing[]
  /** Start one installed connector now. */
  activate(slug: string): DaziConnectorView
  /** Add a connector from the panel, persist it, and start it. */
  add(draft: ConnectorDraft): Promise<DaziConnectorView>
  /** Remove a connector the panel created. */
  remove(slug: string): Promise<void>
}
