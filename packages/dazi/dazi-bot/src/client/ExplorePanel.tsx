/** Explore-apps panel: the installed WorkDazi connectors with their run state. */
import { useCallback, useEffect, useState } from 'react'
import type { ConnectorDraft, DaziConnectorView } from '../types.js'

/** Copy shown by the panel. */
export interface ExploreCopy {
  title: string
  intro: string
  refresh: string
  loading: string
  empty: string
  hint: string
  activate: string
  running: string
  stopped: string
  add: string
  addTitle: string
  name: string
  kind: string
  remote: string
  local: string
  endpoint: string
  endpointHint: string
  command: string
  commandHint: string
  args: string
  argsHint: string
  token: string
  tokenHint: string
  description: string
  save: string
  cancel: string
  remove: string
  removing: string
}

/** One panel read: installed connectors plus why the WorkDazi side is unavailable. */
export interface ExploreSnapshot {
  readonly installed: readonly DaziConnectorView[]
  readonly remoteError: string
}

/** Reader and activator the plugin body hands the panel. */
export interface ExploreActions {
  /** Read installed connectors and run state. */
  readonly explore: () => Promise<ExploreSnapshot>
  /** Start one installed connector now. */
  readonly activate: (slug: string) => Promise<void>
  /** Add a connector and start it. */
  readonly add: (draft: ConnectorDraft) => Promise<void>
  /** Remove a connector this panel created. */
  readonly remove: (slug: string) => Promise<void>
}

/**
 * Render the installed connectors and let the user start a stopped one.
 * @param props - copy plus the reader and activator.
 * @returns the explore page.
 */
export function ExplorePanel({ copy, explore, activate, add, remove }: { readonly copy: ExploreCopy } & ExploreActions) {
  const [snapshot, setSnapshot] = useState<ExploreSnapshot>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', kind: 'remote-mcp', endpoint: '', args: '', token: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback((): void => {
    setError('')
    explore().then(setSnapshot, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    })
  }, [explore])

  useEffect(load, [load])

  const run = (slug: string): void => {
    setPending(slug)
    activate(slug).then(load, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => { setPending('') })
  }

  const submit = (): void => {
    setSaving(true)
    setError('')
    add({
      name: draft.name,
      kind: draft.kind,
      endpoint: draft.endpoint,
      args: draft.args.split(/\s+/).filter(part => part !== ''),
      token: draft.token,
      description: draft.description,
    }).then(() => {
      setAdding(false)
      setDraft({ name: '', kind: 'remote-mcp', endpoint: '', args: '', token: '', description: '' })
      load()
    }, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => { setSaving(false) })
  }

  const drop = (slug: string): void => {
    setPending(slug)
    remove(slug).then(load, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => { setPending('') })
  }

  const installed = snapshot?.installed ?? []
  const notice = error !== '' ? error : snapshot?.remoteError ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', padding: '20px 24px', overflowY: 'auto' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{copy.title}</div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{copy.intro}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={load}>{copy.refresh}</button>
        <button type="button" style={buttonStyle} onClick={() => { setAdding(value => !value) }}>{copy.add}</button>
      </div>
      {adding && (
        <form
          style={formStyle}
          onSubmit={(event) => { event.preventDefault(); submit() }}
        >
          <div style={formTitleStyle}>{copy.addTitle}</div>
          <label style={fieldStyle}>
            <span>{copy.name}</span>
            <input
              style={inputStyle}
              value={draft.name}
              onChange={(event) => { setDraft({ ...draft, name: event.target.value }) }}
              required
            />
          </label>
          <label style={fieldStyle}>
            <span>{copy.kind}</span>
            <select
              style={inputStyle}
              value={draft.kind}
              onChange={(event) => { setDraft({ ...draft, kind: event.target.value }) }}
            >
              <option value="remote-mcp">{copy.remote}</option>
              <option value="local-mcp">{copy.local}</option>
            </select>
          </label>
          <label style={fieldStyle}>
            <span>{draft.kind === 'remote-mcp' ? copy.endpoint : copy.command}</span>
            <input
              style={inputStyle}
              value={draft.endpoint}
              placeholder={draft.kind === 'remote-mcp' ? 'https://example.com/mcp' : 'npx'}
              onChange={(event) => { setDraft({ ...draft, endpoint: event.target.value }) }}
              required
            />
            <small style={hintStyle}>{draft.kind === 'remote-mcp' ? copy.endpointHint : copy.commandHint}</small>
          </label>
          {draft.kind === 'local-mcp' && (
            <label style={fieldStyle}>
              <span>{copy.args}</span>
              <input
                style={inputStyle}
                value={draft.args}
                placeholder="-y @scope/server"
                onChange={(event) => { setDraft({ ...draft, args: event.target.value }) }}
              />
              <small style={hintStyle}>{copy.argsHint}</small>
            </label>
          )}
          {draft.kind === 'remote-mcp' && (
            <label style={fieldStyle}>
              <span>{copy.token}</span>
              <input
                style={inputStyle}
                type="password"
                value={draft.token}
                onChange={(event) => { setDraft({ ...draft, token: event.target.value }) }}
              />
              <small style={hintStyle}>{copy.tokenHint}</small>
            </label>
          )}
          <label style={fieldStyle}>
            <span>{copy.description}</span>
            <input
              style={inputStyle}
              value={draft.description}
              onChange={(event) => { setDraft({ ...draft, description: event.target.value }) }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={buttonStyle} disabled={saving}>{copy.save}</button>
            <button type="button" style={buttonStyle} onClick={() => { setAdding(false) }}>{copy.cancel}</button>
          </div>
        </form>
      )}
      {notice !== '' && <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-warning, #b7791f)' }}>{notice}</div>}
      {snapshot === undefined && error === '' && <div style={{ fontSize: 12, opacity: 0.6 }}>{copy.loading}</div>}
      {snapshot !== undefined && installed.length === 0 && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>{copy.empty}。{copy.hint}</div>
      )}
      {installed.map(connector => (
        <div key={connector.slug} style={rowStyle}>
          <span style={{ ...dotStyle, background: connector.ready ? '#3bb273' : 'rgba(127,127,127,.45)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{connector.name}</div>
            <div style={{ fontSize: 11, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {connector.kind} · {connector.ready ? copy.running : (connector.reason === '' ? copy.stopped : connector.reason)}
            </div>
          </div>
          {!connector.ready && (
            <button type="button" style={buttonStyle} disabled={pending === connector.slug} onClick={() => { run(connector.slug) }}>
              {copy.activate}
            </button>
          )}
          {connector.category === '自定义' && (
            <button type="button" style={buttonStyle} disabled={pending === connector.slug} onClick={() => { drop(connector.slug) }}>
              {pending === connector.slug ? copy.removing : copy.remove}
            </button>
          )}
        </div>
      ))}
      <div style={{ fontSize: 11, opacity: 0.5 }}>{copy.hint}</div>
    </div>
  )
}

const buttonStyle = {
  padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
  border: '1px solid var(--dsw-alias-separator, rgba(127,127,127,.3))', background: 'transparent', color: 'inherit',
} as const

const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
  border: '1px solid var(--dsw-alias-separator, rgba(127,127,127,.22))',
} as const

const dotStyle = { width: 8, height: 8, borderRadius: '50%', flex: 'none' } as const

const formStyle = {
  display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10,
  border: '1px solid var(--dsw-alias-separator, rgba(127,127,127,.3))', maxWidth: 560,
} as const

const formTitleStyle = { fontSize: 13, fontWeight: 600 } as const

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 } as const

const inputStyle = {
  padding: '6px 8px', fontSize: 12, borderRadius: 6, color: 'inherit', background: 'transparent',
  border: '1px solid var(--dsw-alias-separator, rgba(127,127,127,.35))',
} as const

const hintStyle = { fontSize: 11, opacity: 0.55 } as const
