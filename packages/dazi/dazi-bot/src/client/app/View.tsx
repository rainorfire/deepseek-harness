/**
 * Explore apps, browser half: the sidebar entry and the main panel that list
 * the installed WorkDazi connectors with their run state, plus the brand
 * occupants that replace the shipped whale. Clicking blank home space opens
 * the panel.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { HeroFrameOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarPanelIconOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ExploreCopy, ExploreSnapshot } from '../ExplorePanel.js'
import { ExplorePanel } from '../ExplorePanel.js'
import { DaziBrandMark, DaziBrandName, DaziHeroMark } from '../Brand.js'

/** Panel id shared by the sidebar row and the main-panel occupant. */
export const PANEL_ID = 'connector-explore'

/** Required services: slot registry and the main-panel selection. */
export const inject = ['slots', 'layout', 'remote', 'remote.daziConnectors']

/** Copy shown by the explore surface. */
const copy: ExploreCopy = {
  title: '探索未来',
  intro: '拥抱未知，探索未来。这里列出已从 WorkDazi 接入的连接器。',
  refresh: '刷新',
  loading: '加载中…',
  empty: '还没有可用的连接器',
  hint: '安装与凭据在 WorkDazi 的「探索应用」中完成',
  activate: '启用',
  running: '运行中',
  stopped: '未运行',
}

/** Sidebar label. */
const trigger = '探索未来'

/** Elements that handle their own clicks; blank-space navigation leaves them alone. */
const CONTROLS = 'button, a, input, textarea, select, label, [contenteditable], [role="button"], [role="dialog"], [role="menu"], [role="listbox"], [data-composer-card]'

/**
 * Render the connected connectors as a main panel.
 * @param props - copy plus the reader and activator.
 * @returns the explore page.
 */
function ExploreMain({ copy: panelCopy, explore, activate }: { readonly copy: ExploreCopy } & {
  readonly explore: () => Promise<ExploreSnapshot>
  readonly activate: (slug: string) => Promise<void>
}) {
  return <ExplorePanel copy={panelCopy} explore={explore} activate={activate} />
}

/**
 * Wrap the home body: a click on blank space opens the explore panel.
 * @param props - whether the body is the blank home, plus the wrapped content.
 * @returns the frame.
 */
function ExploreFrame({ hero, children }: HeroFrameOwnerProps & { readonly children: React.ReactNode }) {
  return (
    <div
      style={{ display: 'contents' }}
      onClick={hero
        ? (event) => {
          const target = event.target
          if (event.button !== 0 || !(target instanceof Element) || target.closest(CONTROLS) !== null) return
          ctxRef.layout.selectPanel(PANEL_ID as MainPanelId)
        }
        : undefined}
    >
      {children}
    </div>
  )
}

/** Mark rendered in the sidebar panel row. */
function ExploreIcon({ size }: SidebarPanelIconOwnerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  )
}

let ctxRef: ClientContext

/**
 * Mount the explore panel, its sidebar entry, and the brand occupants.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctxRef = ctx
  const explore = async (): Promise<ExploreSnapshot> => {
    const result = await ctx.remote.daziConnectors.explore()
    if (!result.ok) throw new Error(result.error.message)
    return { installed: result.value.installed, remoteError: result.value.remoteError }
  }
  const activate = async (slug: string): Promise<void> => {
    const result = await ctx.remote.daziConnectors.activate(slug)
    if (!result.ok) throw new Error(result.error.message)
  }
  const mainCopy: ExploreCopy = copy
  ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 20,
    label: () => trigger,
  }, ExploreIcon)), 'dazi-bot: explore sidebar entry')
  ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    inject: () => ({ copy: mainCopy, explore, activate }),
  }, ExploreMain)), 'dazi-bot: explore panel')
  ctx.effect(() => ctx.slots.inject('conversation.hero.frame', () => ctx.slots.register({
    name: 'conversation.hero.frame',
    id: 'dazi-explore',
  }, ExploreFrame)), 'dazi-bot: home frame')
  ctx.effect(() => ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({
    name: 'conversation.hero.brand.mark',
  }, DaziHeroMark)), 'dazi-bot: home brand mark')
  ctx.effect(() => ctx.slots.inject('sidebar.brand.name', () => ctx.slots.inject('sidebar.brand.mark', function* () {
    yield ctx.slots.register({ name: 'sidebar.brand.mark' }, DaziBrandMark)
    yield ctx.slots.register({ name: 'sidebar.brand.name' }, DaziBrandName)
  })), 'dazi-bot: sidebar brand')
}
