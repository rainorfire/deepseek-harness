/** Home frame layer: an inert wrapper below the Conversation content. The whale canvas is off. */
import type { ReactNode } from 'react'
import type { HeroFrameOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import css from './PixelWhale.module.css'

/** Frame owner state and the wrapped content. */
export type PixelWhaleProps = HeroFrameOwnerProps & { children: ReactNode }

/**
 * Wrap the Conversation scroll body without painting anything.
 * @param props - the home state, unused, and the wrapped scroll body.
 * @returns a layout-neutral frame around the children.
 */
export function PixelWhale({ children }: PixelWhaleProps) {
  return <div className={css.layer}>{children}</div>
}
