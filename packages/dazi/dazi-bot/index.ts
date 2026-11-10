/**
 * dazi-bot connector plugin, host half.
 *
 * Registers WorkDazi's bundled connectors as MCP servers, and mirrors the
 * connectors the user installed through WorkDazi's app (catalog exploration,
 * install state, remote credentials) so dazi-bot and WorkDazi stay on one set
 * of connectors.
 *
 * - Installed connectors that need no credential (CLI bridges, local stdio
 *   servers) start directly from this plugin and follow the user's WorkDazi
 *   enable choice.
 * - Installed remote connectors start with the credentials the WorkDazi app
 *   decrypts on its localhost control endpoint. Without that endpoint they stay
 *   listed here with the reason they are not running.
 *
 * The plugin reads WorkDazi's own state and does not write it: installs and
 * enable switches belong to the WorkDazi app.
 *
 * @module @dazi/dsh-dazi-bot
 */

import { homedir } from 'node:os'
import { dirname } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { McpServerRegistration } from '@deepseek-ai/dsh-mcp-manager'
import type {} from '@deepseek-ai/dsh-mcp-manager'
import Schema from '@deepseek-ai/schemastery'
import {
  DAZI_STORE_PATH, DEFAULT_CATALOG_PATH, GATEWAY_PATH,
  expandHome, fetchEnabledRemoteInstances, isEnabled, listCatalog,
  readCatalog, readGateway, readInstances, readSessionEnabledIds,
} from './connectors.js'
import type {
  CatalogItem, CatalogListing, EnabledRemoteInstance, StoredInstance,
} from './connectors.js'

export type {
  CatalogItem, CatalogListing, ConnectorTransport, StoredInstance,
} from './connectors.js'

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
  reason?: string
}

/** Snapshot returned to clients. */
export interface DaziConnectorsView {
  /** Installed connectors with run state. */
  installed: DaziConnectorView[]
  /** Why remote connectors cannot start, when they cannot. */
  remoteError?: string
}

/** Plugin configuration. */
export interface Config {
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

export const name = 'dazi-bot-connectors'
export const inject = ['mcpManager']

export const Config: Schema<Config> = Schema.object({
  catalogPath: Schema.string().default(DEFAULT_CATALOG_PATH),
  storePath: Schema.string().default(DAZI_STORE_PATH),
  gatewayPath: Schema.string().default(GATEWAY_PATH),
  nodePath: Schema.string().default(process.execPath),
  ignoreEnableState: Schema.boolean().default(false),
})

/** Screen and computer connectors legitimately run longer than a default tool call. */
const CONNECTOR_TOOL_CALL_TIMEOUT_MS = 10 * 60_000

/**
 * Start each catalog connector as an MCP server and publish the connector view.
 * @param ctx - plugin context; `mcpManager` is ready when this runs.
 * @param config - validated plugin configuration.
 */
export function apply(ctx: Context, config: Config): void {
  const logger = ctx.logger('dazi-bot')
  const catalog = readCatalog(config.catalogPath, config.storePath)
  if (catalog.length === 0) logger.warn('连接器目录为空或无法读取：%s', config.catalogPath)
  const ignoreEnableState = config.ignoreEnableState ?? false
  const binDir = dirname(config.nodePath ?? process.execPath)
  const baseEnv = {
    PATH: `${binDir}:${process.env.PATH ?? ''}`,
    WORKDAZI_KERNEL_KIND: 'dazi',
  }

  const disposers = new Map<string, () => void>()
  let remoteInstances: readonly EnabledRemoteInstance[] = []
  let remoteError: string | undefined

  /** Instance ids named by any session enable set in WorkDazi. */
  function sessionEnabledIds(): Set<string> {
    return ignoreEnableState
      ? new Set(readInstances(config.storePath).map(instance => instance.id))
      : readSessionEnabledIds(config.storePath)
  }

  function enabled(instance: StoredInstance, ids: ReadonlySet<string>): boolean {
    return ignoreEnableState || isEnabled(instance, ids)
  }

  function registration(item: CatalogItem, instance: StoredInstance): McpServerRegistration | undefined {
    switch (item.transport.kind) {
      case 'cli-bridge': {
        const bridge = item.transport.bridge?.trim()
        if (!bridge) return undefined
        return {
          transport: 'stdio',
          command: '/bin/sh',
          args: ['-c', expandHome(bridge)],
          env: baseEnv,
          cwd: homedir(),
          toolCallTimeoutMs: CONNECTOR_TOOL_CALL_TIMEOUT_MS,
        }
      }
      case 'local-mcp':
        return {
          transport: 'stdio',
          command: expandHome(item.transport.command),
          args: item.transport.args ?? [],
          env: { ...baseEnv, ...item.transport.env },
          cwd: homedir(),
          toolCallTimeoutMs: CONNECTOR_TOOL_CALL_TIMEOUT_MS,
        }
      case 'remote-mcp': {
        const remote = remoteInstances.find(candidate => candidate.slug === instance.slug)
        if (remote === undefined) return undefined
        return {
          transport: 'streamable-http',
          url: remote.url,
          headers: remote.headers ?? {},
          ...remote.timeoutMs === undefined ? {} : { toolCallTimeoutMs: remote.timeoutMs },
        }
      }
      default:
        return undefined
    }
  }

  /** Why a connector is not running; undefined while it runs. */
  function reasonFor(item: CatalogItem, instance: StoredInstance, isEnabled: boolean): string | undefined {
    if (instance.state !== undefined && instance.state !== 'ready') return `WorkDazi 中状态为 ${instance.state}`
    if (!isEnabled) return '在 WorkDazi 中未启用'
    switch (item.transport.kind) {
      case 'remote-mcp':
        return remoteError
      case 'cli-bridge':
        return item.transport.bridge?.trim() ? undefined : '目录条目缺少启动命令'
      case 'local-mcp':
        return undefined
      default:
        return undefined
    }
  }

  /** Register, unregister, and rebuild servers so they match WorkDazi's installs and switches. */
  function reconcile(): void {
    const instances = readInstances(config.storePath)
    const ids = sessionEnabledIds()
    const bySlug = new Map(instances.map(instance => [instance.slug, instance]))
    for (const [slug, dispose] of disposers) {
      const instance = bySlug.get(slug)
      const item = catalog.find(candidate => candidate.slug === slug)
      if (instance === undefined || item === undefined || !enabled(instance, ids)) {
        dispose()
        disposers.delete(slug)
      } else if (item.transport.kind === 'remote-mcp') {
        // The remote entry's credential or URL may have changed; mcp-manager rebuilds on any config change.
        dispose()
        disposers.delete(slug)
        const entry = registration(item, instance)
        if (entry === undefined) continue
        try {
          disposers.set(slug, ctx.mcpManager.register(slug, entry))
        } catch (error) {
          logger.warn('连接器 %s 重新注册失败：%s', slug, error instanceof Error ? error.message : String(error))
        }
      }
    }
    for (const instance of instances) {
      if (!enabled(instance, ids) || disposers.has(instance.slug)) continue
      const item = catalog.find(candidate => candidate.slug === instance.slug)
      if (item === undefined) continue
      const entry = registration(item, instance)
      if (entry === undefined) continue
      try {
        disposers.set(item.slug, ctx.mcpManager.register(item.slug, entry))
      } catch (error) {
        // A rejected entry must not take the host down: the view reports why the connector is not running.
        logger.warn('连接器 %s 注册失败：%s', item.slug, error instanceof Error ? error.message : String(error))
      }
    }
  }

  /** Re-read the control endpoint, then reconcile. */
  async function refreshRemote(): Promise<void> {
    remoteInstances = []
    remoteError = undefined
    const gateway = readGateway(config.gatewayPath)
    if (gateway === undefined) {
      remoteError = '未找到 WorkDazi 连接器控制口（先启动 WorkDazi 应用）'
    } else {
      try {
        remoteInstances = await fetchEnabledRemoteInstances(gateway)
      } catch (error) {
        remoteError = `WorkDazi 连接器控制口不可用：${error instanceof Error ? error.message : String(error)}`
      }
    }
    reconcile()
  }

  /** Installed connectors with run state. */
  function describe(): DaziConnectorView[] {
    const ids = sessionEnabledIds()
    return readInstances(config.storePath).flatMap((instance): DaziConnectorView[] => {
      const item = catalog.find(candidate => candidate.slug === instance.slug)
      if (item === undefined) return []
      const isEnabled = enabled(instance, ids)
      const running = disposers.has(item.slug)
      const reason = running ? undefined : reasonFor(item, instance, isEnabled)
      return [{
        id: instance.id,
        slug: item.slug,
        name: instance.displayName ?? item.name,
        category: item.category ?? '',
        kind: item.transport.kind,
        enabled: isEnabled,
        ready: running,
        ...reason === undefined ? {} : { reason },
      }]
    })
  }

  /** Catalog with install state. */
  function list(): CatalogListing[] {
    return listCatalog(readInstances(config.storePath), catalog)
  }

  /** Re-read remote credentials and reconcile, then report the current view. */
  async function refresh(): Promise<CatalogListing[]> {
    await refreshRemote()
    ctx.emit('dazi-bot/connectors-changed')
    return view()
  }

  /** Catalog with install state. */
  function view(): CatalogListing[] {
    return list()
  }

  // The view is built on demand for clients; keep refresh and list allocated so
  // enabling them in the Remote surface does not change plugin behavior.
  void describe
  void view
  void refresh
  ctx.effect(() => {
    void refreshRemote()
    const off = ctx.on('mcp-manager/status', (serverName, status) => {
      if (!disposers.has(serverName) || status.state !== 'failed') return
      logger.warn('连接器 %s 启动失败：%s', serverName, 'lastError' in status ? status.lastError : status.reason)
      ctx.emit('dazi-bot/connectors-changed')
    })
    return () => {
      off()
      for (const dispose of disposers.values()) dispose()
      disposers.clear()
    }
  }, 'dazi-bot: connectors')
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * The connector catalog or run state changed.
     * @mode parallel
     */
    'dazi-bot/connectors-changed'(): void | Promise<void>
  }
}
