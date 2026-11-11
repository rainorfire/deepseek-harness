/** Dazi Bot brand occupants: the sidebar mark and name, and the new-session headline mark. */
import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import iconUrl from './assets/dazi-bot-brand.png'

/**
 * Render the app icon at the requested edge.
 * @param props - size and the host's class.
 * @returns the brand image.
 */
function BrandIcon({ size, className }: { readonly size: number; readonly className?: string | undefined }) {
  return (
    <img
      src={iconUrl}
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      style={{ borderRadius: Math.round(size * 0.22), objectFit: 'cover' }}
    />
  )
}

/**
 * Render the sidebar brand mark.
 * @param props - sidebar geometry.
 * @returns the brand icon.
 */
export function DaziBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <BrandIcon size={size} />
}

/** Render the sidebar brand name. */
export function DaziBrandName() {
  return <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.2 }}>Dazi Bot</span>
}

/**
 * Render the new-session headline mark.
 * @param props - headline geometry and the host's class.
 * @returns the brand icon.
 */
export function DaziHeroMark({ size, className }: HeroBrandMarkOwnerProps) {
  return <BrandIcon size={size} className={className} />
}
