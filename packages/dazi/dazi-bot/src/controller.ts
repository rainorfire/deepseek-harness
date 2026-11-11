/**
 * Connector exploration over the authenticated Remote, for the browser's
 * "explore apps" panel: the WorkDazi connector catalog, the user's installs
 * with their run state, and live activation of one installed connector without
 * a host restart.
 *
 * @module @dazi/dsh-dazi-bot/controller
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { DaziConnectorView, DaziConnectorsHost } from './contract.js'

export type {
  ConnectorCatalogRow, ConnectorExploration,
} from './types.js'
import type { ConnectorExploration } from './types.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Connector exploration endpoint. */
    daziConnectors: DaziConnectorsController
  }
}

/** Remote surface backing the explore panel. */
export class DaziConnectorsController extends TypertRemoteService {
  static inject = ['typert']

  /**
   * @param ctx - Host context carrying the connector plugin's host state.
   * @param host - the connector plugin's catalog, install, and activation state.
   */
  constructor(ctx: Context, private readonly host: DaziConnectorsHost) {
    super(ctx, 'daziConnectors', { namespace: 'daziConnectors' })
  }

  /**
   * Read the catalog with WorkDazi's install and run state.
   * @returns the exploration snapshot.
   */
  @Remote
  async explore(): Promise<ConnectorExploration> {
    await this.host.refresh()
    const installed = this.host.describe()
    return {
      catalog: this.host.catalog().map(item => ({
        slug: item.slug,
        name: item.name,
        description: item.description ?? '',
        category: item.category ?? '',
        kind: item.transport.kind,
        skill: item.skill ?? '',
        installed: installed.some(connector => connector.slug === item.slug),
        state: installed.find(connector => connector.slug === item.slug)?.enabled === true ? 'enabled' : '',
        lastError: installed.find(connector => connector.slug === item.slug)?.reason ?? '',
      })),
      installed,
      remoteError: this.host.remoteError() ?? '',
      workdaziFound: this.host.catalog().length > 0,
    }
  }

  /**
   * Ask WorkDazi's control endpoint for fresh remote credentials and reconcile.
   * @returns the refreshed exploration snapshot.
   */
  @Remote
  async refresh(): Promise<ConnectorExploration> {
    return await this.explore()
  }

  /**
   * Start one installed connector now. Remote connectors need WorkDazi's
   * control endpoint; a connector whose catalog entry WorkDazi does not hold
   * cannot be started.
   * @param slug - catalog slug of an installed connector.
   * @returns the run state after the attempt.
   */
  @Remote
  activate(slug: string): DaziConnectorView {
    try {
      return this.host.activate(slug)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      throw new RemoteError('gateway/internal', `连接器 ${slug} 启动失败：${message}`, {}, { cause: error })
    }
  }
}
