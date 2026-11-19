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
 * Nothing new is logged. The model-visible set is derived from what the log
 * already records: a `tool_search` result lists the tools it revealed, and the
 * guard's refusal names the tool a call tried. Both are ordinary tool results,
 * so a harness without this package reads the Session unchanged.
 *
 * @module @dazi/dsh-dazi-bot/tool-search
 */

import { Service, type Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool, projectToolSchema } from '@deepseek-ai/dsh-tools'
import type { ToolModelInput } from '@deepseek-ai/dsh-tools'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'

/** Name of the search tool this module owns. */
export const TOOL_SEARCH_NAME = 'tool_search'

/** Largest number of matches one search returns. */
const MAX_MATCHES = 8

/** Budgets for the text one match reports back. */
const MATCH_DESCRIPTION_CHARS = 400
const MATCH_SCHEMA_CHARS = 2400

/** Prefix of the guard's refusal text; the tool name follows it. */
const UNDECLARED_MARKER = 'connector tool not declared yet: '

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
  static inject = ['tools', 'agents', 'sessions']

  /** Connector tools this module hides: exact name → connector label. */
  private readonly hidden = new Map<string, string>()
  /** Tools each Session's log already shows as revealed. */
  private readonly revealed = new WeakMap<Session, Set<string>>()
  /** Per-agent scope that installed the filtering executor. */
  private readonly installed = new Map<Agent, ReturnType<Context['inject']>>()
  /** Agent whose step is being assembled, set by `agent/pre-step`. */
  private describing: Agent | undefined

  constructor(ctx: Context) {
    super(ctx, 'connectorToolSearch')
  }

  protected async [Service.init](): Promise<void> {
    const ctx = this.ctx
    // Rebuild each Session's revealed set from its own committed events, so a
    // resumed or forked conversation reads back the same declarations.
    // Live events only: a Session is rebuilt from its log by the provider that
    // owns resumption, and this set is one step behind at worst, which only
    // means a resumed turn asks for a tool again.
    ctx.on('session/event', (session, event) => this.note(session, event))
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
      if (this.stateOf(exec.agent.session).has(exec.name)) return undefined
      return `${UNDECLARED_MARKER}${exec.name}. It is declared from your next request; call it again.`
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
    const revealed = this.stateOf(agent.session)
    return {
      ...described,
      schemas: described.schemas.filter(schema =>
        !this.hidden.has(schema.name) || revealed.has(schema.name)),
    }
  }

  /**
   * Whether any connector tool is still hidden; callers skip this filter otherwise.
   * @returns true while at least one tool is withheld.
   */
  get active(): boolean {
    return this.hidden.size > 0
  }

  /** Tools one Session's log shows as revealed. */
  private stateOf(session: Session): Set<string> {
    let state = this.revealed.get(session)
    if (state === undefined) {
      state = new Set()
      this.revealed.set(session, state)
    }
    return state
  }

  /** Record an event that reveals connector tools. */
  private note(session: Session, event: SessionEvent): void {
    this.fold(this.stateOf(session), event)
  }

  /**
   * Fold one committed event into a revealed set. A `tool_search` result names
   * its matches in a fixed line; the guard's refusal names one tool.
   * @param state - the Session's revealed set, updated in place.
   * @param event - committed session event.
   */
  private fold(state: Set<string>, event: SessionEvent): void {
    if (event.type !== 'tool/result') return
    const message = event.data.message
    if (message.source.kind !== 'tool') return
    const text = message.content.map(block => block.type === 'text' ? block.text : '').join('\n')
    const match = /matching connector tool\(s\), now callable:\n([\s\S]*)$/u.exec(text)
    if (match !== null) {
      for (const line of (match[1] ?? '').split('\n')) {
        const name = /^### (\S+)$/u.exec(line)?.[1]
        if (name !== undefined) state.add(name)
      }
      return
    }
    const at = text.indexOf(UNDECLARED_MARKER)
    if (at >= 0) {
      const name = text.slice(at + UNDECLARED_MARKER.length).split(/[\s"：]/u)[0]
      if (name !== undefined && name !== '') state.add(name)
    }
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
    return [
      `${String(matches.length)} matching connector tool(s), now callable:`,
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
}declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Hides connector tools behind `tool_search` for every agent. */
    connectorToolSearch: ConnectorToolSearch
  }
}
