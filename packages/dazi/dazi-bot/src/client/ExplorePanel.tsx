/** Explore-apps panel: the installed WorkDazi connectors with their run state. */
import { useCallback, useEffect, useState } from 'react'
import type { DaziConnectorView } from '../types.js'

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
}

/**
 * Render the installed connectors and let the user start a stopped one.
 * @param props - copy plus the reader and activator.
 * @returns the explore page.
 */
export function ExplorePanel({ copy, explore, activate }: { readonly copy: ExploreCopy } & ExploreActions) {
  const [snapshot, setSnapshot] = useState<ExploreSnapshot>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')

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

  const installed = snapshot?.installed ?? []
  const notice = error !== '' ? error : snapshot?.remoteError ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', padding: '20px 24px', overflowY: 'auto' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{copy.title}</div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{copy.intro}</div>
      </div>
      <div>
        <button type="button" style={buttonStyle} onClick={load}>{copy.refresh}</button>
      </div>
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
