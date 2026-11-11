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

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** WorkDazi's shared state directory. */
export const DAZI_HOME = join(homedir(), '.dazi')

/** Control endpoint descriptor written by the WorkDazi app. */
export const GATEWAY_PATH = join(DAZI_HOME, 'connectors', 'gateway.json')

/** WorkDazi's electron-store file, which holds settings and connector instances. */
export const DAZI_STORE_PATH = join(homedir(), 'Library', 'Application Support', 'work-dazi', 'workdazi.json')

/** Connector catalog shipped inside the WorkDazi application. */
export const DEFAULT_CATALOG_PATH = '/Applications/WorkDazi.app/Contents/Resources/connectors/catalog/index.json'

/** Transport a connector starts as an MCP server. */
export type ConnectorTransport =
  | { kind: 'remote-mcp'; url: string; timeout?: number }
  | { kind: 'cli-bridge'; detect?: string; bridge?: string }
  | { kind: 'local-mcp'; command: string; args?: string[]; env?: Record<string, string> }

/** One catalog entry, limited to the fields this package acts on. */
export interface CatalogItem {
  slug: string
  name: string
  name_en?: string
  description?: string
  category?: string
  transport: ConnectorTransport
  auth?: { type: 'oauth' | 'api-key' | 'none'; note?: string }
  source?: string
  icon?: string | null
  examples?: string[]
  applyUrl?: string
  applyHint?: string
  /** Kernel-direct exposure limits the catalog may declare; applied as `enabledTools`. */
  codexDirect?: { startupTimeoutSec?: number; enabledTools?: string[] }
  /** Bundled skill names the catalog attaches, shown in the explore panel. */
  skill?: string
}

/** One connector installed through WorkDazi. */
export interface StoredInstance {
  id: string
  slug: string
  displayName?: string
  state?: string
  defaultEnabled?: boolean
  lastError?: string
}

/** Control endpoint descriptor. */
export interface GatewayDescriptor {
  controlUrl: string
  controlToken?: string
  nodeDir?: string
}

/** A remote instance as WorkDazi's control endpoint enables it, with its decrypted credential. */
export interface EnabledRemoteInstance {
  id: string
  slug: string
  url: string
  timeoutMs?: number
  headers?: Record<string, string>
}

/** Catalog paired with install state, as presented to the user. */
export interface CatalogListing {
  item: CatalogItem
  installed: boolean
  /** State of the installed instance, when there is one. */
  state?: string
  lastError?: string
}

type Json = Record<string, unknown>

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return undefined
  }
}

function stringRecord(value: unknown): Record<string, string> | undefined {
  if (!isObject(value)) return undefined
  const entries = Object.entries(value).filter((pair): pair is [string, string] => typeof pair[1] === 'string')
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/** Settings object from WorkDazi's store. */
function readSettings(path = DAZI_STORE_PATH): Json | undefined {
  const store = readJson(path)
  return isObject(store) && isObject(store.settings) ? store.settings : undefined
}

/** The `connectors` section of WorkDazi's settings. */
function readConnectorSettings(path = DAZI_STORE_PATH): Json | undefined {
  const connectors = readSettings(path)?.connectors
  return isObject(connectors) ? connectors : undefined
}

/** Read the control endpoint recorded by the WorkDazi app. */
export function readGateway(path = GATEWAY_PATH): GatewayDescriptor | undefined {
  const raw = readJson(path)
  if (!isObject(raw) || typeof raw.controlUrl !== 'string') return undefined
  return {
    controlUrl: raw.controlUrl,
    ...typeof raw.controlToken === 'string' ? { controlToken: raw.controlToken } : {},
    ...typeof raw.nodeDir === 'string' ? { nodeDir: raw.nodeDir } : {},
  }
}

/**
 * Ask the WorkDazi control endpoint for the remote instances it enables. This
 * is the only path to remote credentials: the WorkDazi app decrypts them.
 * @param gateway - descriptor from {@link readGateway}.
 * @param timeoutMs - budget for the request.
 * @returns enabled remote instances with their headers.
 * @throws when the endpoint is unreachable or refuses the token.
 */
export async function fetchEnabledRemoteInstances(gateway: GatewayDescriptor, timeoutMs = 5000): Promise<EnabledRemoteInstance[]> {
  const res = await fetch(`${gateway.controlUrl.replace(/\/$/, '')}/config`, {
    headers: gateway.controlToken ? { Authorization: `Bearer ${gateway.controlToken}` } : {},
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`WorkDazi 连接器控制口返回 ${res.status}`)
  const data: unknown = await res.json()
  if (!isObject(data) || !Array.isArray(data.instances)) return []
  return data.instances.filter(isObject).flatMap((entry): EnabledRemoteInstance[] => {
    const transport = entry.transport
    if (!isObject(transport) || transport.kind !== 'remote-mcp' || typeof transport.url !== 'string') return []
    if (typeof entry.id !== 'string' || typeof entry.slug !== 'string') return []
    const headers = stringRecord(entry.headers)
    return [{
      id: entry.id,
      slug: entry.slug,
      url: transport.url,
      ...typeof transport.timeout === 'number' ? { timeoutMs: transport.timeout } : {},
      ...headers === undefined ? {} : { headers },
    }]
  })
}

function isTransport(value: unknown): value is ConnectorTransport {
  if (!isObject(value)) return false
  if (value.kind === 'remote-mcp') return typeof value.url === 'string'
  if (value.kind === 'cli-bridge') return true
  return value.kind === 'local-mcp' && typeof value.command === 'string'
}

function toAuth(value: unknown): CatalogItem['auth'] {
  if (!isObject(value)) return undefined
  const type = value.type
  if (type !== 'oauth' && type !== 'api-key' && type !== 'none') return undefined
  return { type, ...typeof value.note === 'string' ? { note: value.note } : {} }
}

function toCatalogItem(value: unknown): CatalogItem | undefined {
  if (!isObject(value) || typeof value.slug !== 'string' || typeof value.name !== 'string') return undefined
  if (!isTransport(value.transport)) return undefined
  const auth: CatalogItem['auth'] = toAuth(value.auth)
  return {
    ...auth === undefined ? {} : { auth },
    slug: value.slug,
    name: value.name,
    ...typeof value.name_en === 'string' ? { name_en: value.name_en } : {},
    ...typeof value.description === 'string' ? { description: value.description } : {},
    ...typeof value.category === 'string' ? { category: value.category } : {},
    ...typeof value.source === 'string' ? { source: value.source } : {},
    ...typeof value.icon === 'string' || value.icon === null ? { icon: value.icon } : {},
    ...Array.isArray(value.examples) ? { examples: value.examples.filter((example): example is string => typeof example === 'string') } : {},
    ...typeof value.applyUrl === 'string' ? { applyUrl: value.applyUrl } : {},
    ...typeof value.applyHint === 'string' ? { applyHint: value.applyHint } : {},
    ...Array.isArray(value.skills) && typeof value.skills[0] === 'string' ? { skill: value.skills[0] } : {},
    ...isObject(value.codexDirect) ? {
      codexDirect: {
        ...typeof value.codexDirect.startupTimeoutSec === 'number' ? { startupTimeoutSec: value.codexDirect.startupTimeoutSec } : {},
        ...Array.isArray(value.codexDirect.enabledTools)
          ? { enabledTools: value.codexDirect.enabledTools.filter((tool): tool is string => typeof tool === 'string') }
          : {},
      },
    } : {},
    transport: value.transport,
  }
}

/** Read the connector catalog WorkDazi explores: the bundled index plus custom entries. */
export function readCatalog(path = DEFAULT_CATALOG_PATH, storePath = DAZI_STORE_PATH): CatalogItem[] {
  const raw = readJson(path)
  const items: unknown[] = []
  if (isObject(raw) && Array.isArray(raw.categories)) {
    for (const group of raw.categories) {
      if (isObject(group) && Array.isArray(group.items)) items.push(...group.items)
    }
  }
  const custom = readConnectorSettings(storePath)?.customCatalog
  if (Array.isArray(custom)) items.push(...custom)
  const seen = new Set<string>()
  return items.flatMap((value) => {
    const item = toCatalogItem(value)
    if (item === undefined || seen.has(item.slug)) return []
    seen.add(item.slug)
    return [item]
  })
}

/** Read the connectors the user installed through WorkDazi, in install order. */
export function readInstances(storePath = DAZI_STORE_PATH): StoredInstance[] {
  const instances = readConnectorSettings(storePath)?.instances
  if (!Array.isArray(instances)) return []
  const seen = new Set<string>()
  return instances.flatMap((value): StoredInstance[] => {
    if (!isObject(value) || typeof value.id !== 'string' || typeof value.slug !== 'string') return []
    if (seen.has(value.slug)) return []
    seen.add(value.slug)
    return [{
      id: value.id,
      slug: value.slug,
      ...typeof value.displayName === 'string' ? { displayName: value.displayName } : {},
      ...typeof value.state === 'string' ? { state: value.state } : {},
      ...typeof value.defaultEnabled === 'boolean' ? { defaultEnabled: value.defaultEnabled } : {},
      ...typeof value.lastError === 'string' ? { lastError: value.lastError } : {},
    }]
  })
}

/** Whether an installed instance is enabled: ready, and either default-enabled or named by a session set. */
export function isEnabled(instance: StoredInstance, sessionIds: ReadonlySet<string>): boolean {
  return instance.state === 'ready' && (instance.defaultEnabled === true || sessionIds.has(instance.id))
}

/** Session-level enable sets from WorkDazi's settings, flattened to instance ids. */
export function readSessionEnabledIds(storePath = DAZI_STORE_PATH): Set<string> {
  const sets = readConnectorSettings(storePath)?.sessionSets
  const ids = new Set<string>()
  if (isObject(sets)) {
    for (const value of Object.values(sets)) {
      if (Array.isArray(value)) for (const id of value) if (typeof id === 'string') ids.add(id)
    }
  }
  return ids
}

/** Pair the catalog with WorkDazi's install state. */
export function listCatalog(instances: readonly StoredInstance[], catalog: readonly CatalogItem[]): CatalogListing[] {
  const bySlug = new Map(instances.map(instance => [instance.slug, instance]))
  return catalog.map((item) => {
    const instance = bySlug.get(item.slug)
    if (instance === undefined) return { item, installed: false }
    return {
      item,
      installed: true,
      ...instance.state !== undefined ? { state: instance.state } : {},
      ...instance.lastError !== undefined ? { lastError: instance.lastError } : {},
    }
  })
}

/** Expand a leading `~` to the home directory. */
export function expandHome(command: string): string {
  return command.replace(/^~(?=\/|$)/, homedir())
}
