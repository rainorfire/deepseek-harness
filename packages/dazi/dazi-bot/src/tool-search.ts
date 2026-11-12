/**
 * Tool search for the connectors this bundle mounts.
 *
 * A connector set can expose hundreds of MCP tools whose JSON schemas run to
 * megabytes; declaring them all makes an ordinary request exceed upstream
 * limits. This module keeps those tools out of the model's declarations until
 * the model asks for them: `tool_search` matches names and descriptions, and
 * every tool it returns becomes declared from the next step on, for that
 * agent's Session only. Calling a hidden tool by name also works — the guard
 * reveals it and asks for the call again.
 *
 * The selection is logged as `tool-search/expose` because the model-visible
 * tool set must be reconstructable from the Session log after a restart or fork.
 *
 * @module @dazi/dsh-dazi-bot/tool-search
 */

import { Service, type Context } from '@deepseek-ai/cordis'
import { z as zod } from 'zod'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool, projectToolSchema } from '@deepseek-ai/dsh-tools'
import type { ToolModelInput } from '@deepseek-ai/dsh-tools'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type { ProjectionDefinition, ProjectionHandle } from '@deepseek-ai/dsh-session-projection'

/** Name of the search tool this module owns. */
export const TOOL_SEARCH_NAME = 'tool_search'

/** Largest number of matches one search returns. */
const MAX_MATCHES = 8

/** Budgets for the text one match reports back. */
const MATCH_DESCRIPTION_CHARS = 400
const MATCH_SCHEMA_CHARS = 2400

/** Selection of connector tools for one Session. */
export interface ToolSearchState {
  /** Tool names exposed to the agent, in exposure order. */
  exposed: string[]
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * Connector tools now visible to this Session's agent: log-only and
     * cumulative. Names are tool names as the model sees them.
     */
    'tool-search/expose': { tools: string[] }
  }
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /** Connector tools this Session's agent has exposed through `tool_search`. */
    'tool-search': ToolSearchState
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Hides connector tools behind `tool_search` for every agent. */
    connectorToolSearch: ConnectorToolSearch
  }
}

const toolSearchStateSchema = zod.object({
  exposed: zod.array(zod.string()),
}).strict()

/** Projection of logged exposures; a fork inherits its parent's selection. */
export const toolSearchProjectionDefinition = {
  key: 'tool-search',
  stateVersion: 1,
  stateSchema: toolSearchStateSchema,
  init: (): ToolSearchState => ({ exposed: [] }),
  apply: (state: ToolSearchState, event: SessionEvent): ToolSearchState => {
    if (event.type !== 'tool-search/expose') return state
    const exposed = [...state.exposed]
    for (const name of event.data.tools) if (!exposed.includes(name)) exposed.push(name)
    return { exposed }
  },
  wire: {
    viewSchema: toolSearchStateSchema,
    view: (state: ToolSearchState) => state,
  },
} satisfies ProjectionDefinition<'tool-search', ToolSearchState>

/** Shorten text to a fixed budget with a marker the model can see. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…[truncated]`
}

/** Tool arguments arrive as lossless JSON; keep the two declared fields. */
function readArgs(args: unknown): { query: string; server?: string | undefined } {
  if (typeof args !== 'object' || args === null) return { query: '' }
  const record = args as Record<string, unknown>
  return {
    query: typeof record.query === 'string' ? record.query : '',
    ...typeof record.server === 'string' && record.server.trim() !== '' ? { server: record.server } : {},
  }
}

/**
 * Keep connector tools hidden until a Session's agent asks for them.
 *
 * Hiding happens in the tool executor's `describe`, the one place the
 * model-facing declaration set is decided; every other executor behaviour is
 * delegated unchanged. A hidden call still dispatches, and the guard that runs
 * before the tool body records the exposure so the conversation can continue.
 */
export class ConnectorToolSearch extends Service {
  static inject = ['tools', 'sessionProjections', 'agents']

  /** Connector tools this module hides: exact name → connector label. */
  private readonly hidden = new Map<string, string>()
  private handle: ProjectionHandle<ToolSearchState> | undefined
  private release: (() => void) | undefined
  /** Per-agent scope that installed the filtering executor. */
  private readonly installed = new Map<Agent, ReturnType<Context['inject']>>()
  /** Agent whose step is being assembled, set by `agent/pre-step`. */
  private describing: Agent | undefined

  constructor(ctx: Context) {
    super(ctx, 'connectorToolSearch')
  }

  protected async [Service.init](): Promise<void> {
    const ctx = this.ctx
    this.handle = await ctx.sessionProjections.register(toolSearchProjectionDefinition)
    // Each agent's scope gets an executor whose description omits the connector
    // tools that agent has not exposed. The executor below is captured once,
    // because a scope admits only one executor.
    const install = (agent: Agent): void => {
      if (this.installed.has(agent)) return
      const fiber = agent.ctx.inject(['tools'], (scope) => {
        const inner = scope.tools.currentExecutor()
        return scope.tools.setExecutor({
          describe: tools => this.describe(inner.describe(tools), agent),
          execute: input => inner.execute(input),
        })
      })
      this.installed.set(agent, fiber)
    }
    for (const agent of ctx.agents.list()) install(agent)
    ctx.on('agent/created', ({ agent }) => { install(agent) })
    ctx.on('agent/disposed', ({ agent }) => {
      const fiber = this.installed.get(agent)
      this.installed.delete(agent)
      void fiber?.dispose()
    })
    ctx.tools.register(defineTool({
      name: TOOL_SEARCH_NAME,
      description: 'Search the connector tools available in this session and make the matches callable. '
        + 'Connector tools are hidden from your declarations to keep requests small; call this with a keyword '
        + 'to reveal the tools you need, then call them.',
      parameters: {
        query: { type: 'string', required: true, description: 'Keyword matched against tool names and descriptions.' },
        server: { type: 'string', description: 'Restrict the search to one connector (its name or slug).' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: String(value) }],
      },
      execute: (args, exec) => Promise.resolve(this.search(readArgs(args), exec.agent)),
    }))
    ctx.tools.guard((exec) => {
      if (exec.agent === undefined || !this.hidden.has(exec.name)) return undefined
      if (this.stateOf(exec.agent).exposed.includes(exec.name)) return undefined
      this.expose(exec.agent, [exec.name])
      return `"${exec.name}" is a connector tool that was not declared yet. It is now available; call it again.`
    })
  }

  /**
   * Narrow one step's declarations to what its agent exposed.
   * @param described - the executor's own description of the step's tools.
   * @param agent - agent whose step is being described.
   * @returns the description minus unexposed connector tools.
   */
  describeCurrent(described: ToolModelInput): ToolModelInput {
    return this.describing === undefined ? described : this.describe(described, this.describing)
  }

  /** Agent whose step is being assembled, when one is. */
  get currentAgent(): Agent | undefined {
    return this.describing
  }

  describe(described: ToolModelInput, agent: Agent): ToolModelInput {
    if (this.hidden.size === 0) return described
    const exposed = this.stateOf(agent).exposed
    return {
      ...described,
      schemas: described.schemas.filter(schema =>
        !this.hidden.has(schema.name) || exposed.includes(schema.name)),
    }
  }

  /**
   * Whether any connector tool is still hidden; callers skip this filter otherwise.
   * @returns true while at least one tool is withheld.
   */
  get active(): boolean {
    return this.hidden.size > 0
  }

  /** Selection for one Session, seeded from its log. */
  private stateOf(agent: Agent): ToolSearchState {
    if (this.handle === undefined) throw new Error('connector tool search is not ready')
    return this.handle.stateOf(agent.session)
  }

  /** Append newly visible names; the projection applies them before the next step. */
  private expose(agent: Agent, names: readonly string[]): void {
    const state = this.stateOf(agent)
    const fresh = names.filter(name => !state.exposed.includes(name))
    if (fresh.length === 0) return
    agent.session.append('tool-search/expose', { tools: fresh })
  }

  /** Match the query against hidden tool declarations and expose the matches. */
  private search(args: { query: string; server?: string | undefined }, agent: Agent | undefined): string {
    if (agent === undefined) return 'error: tool_search needs an agent context'
    const query = args.query.trim().toLowerCase()
    if (query === '') return 'error: pass a non-empty query'
    const matches: Array<{ name: string; description: string; parameters: string }> = []
    for (const [name, label] of this.hidden) {
      if (args.server !== undefined && !name.includes(args.server) && !label.toLowerCase().includes(args.server.toLowerCase())) continue
      const definition = this.ctx.tools.get(name, agent)
      if (definition === undefined) continue
      if (!`${name}\n${definition.description}\n${label}`.toLowerCase().includes(query)) continue
      matches.push({
        name,
        description: clip(definition.description, MATCH_DESCRIPTION_CHARS),
        parameters: clip(JSON.stringify(projectToolSchema(definition, false).parameters), MATCH_SCHEMA_CHARS),
      })
      if (matches.length >= MAX_MATCHES) break
    }
    if (matches.length === 0) {
      return `No connector tool matches "${args.query}". Known connectors: ${[...new Set(this.hidden.values())].join(', ')}`
    }
    this.expose(agent, matches.map(match => match.name))
    return [
      `${String(matches.length)} matching connector tool(s), declared from your next request; you may call them now:`,
      ...matches.map(match => `\n### ${match.name}\n${match.description}\nParameters (JSON Schema): ${match.parameters}`),
    ].join('\n')
  }

  /**
   * Declare connector tools as hidden until searched.
   * @param names - tool names exactly as the model sees them.
   * @param label - connector label used in search results.
   */
  hide(names: readonly string[], label: string): void {
    for (const name of names) this.hidden.set(name, label)
  }

  /**
   * Stop hiding names whose tools left the registry.
   * @param names - tool names to forget.
   */
  forget(names: readonly string[]): void {
    for (const name of names) this.hidden.delete(name)
  }

  /** Release resources owned by this service (none today; the executor selection is the host's). */
  protected [Symbol.dispose](): void {
    this.release?.()
  }
}
