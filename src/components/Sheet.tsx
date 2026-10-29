import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  sub?: string
  children: ReactNode
  footer?: ReactNode
  tall?: boolean
}

/** 아래에서 올라오는 창. Esc 로 닫히고, 닫히면 원래 누른 곳으로 초점을 돌려준다. */
export function Sheet({ open, onClose, title, sub, children, footer, tall }: Props) {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    // 정해 둔 곳이 있으면 거기로, 없으면 창 자체로 초점을 옮긴다 (닫기 단추에 테두리가 생기지 않게)
    const t = window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current
      target?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className={`sheet${tall ? ' sheet--tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <div className="sheet__grabber" aria-hidden="true" />
        <div className="sheet__head">
          <div>
            <h2 id={id} className="sheet__title">{title}</h2>
            {sub && <p className="sheet__sub">{sub}</p>}
          </div>
          <button type="button" className="icon-btn icon-btn--filled" onClick={onClose} aria-label="닫기">
            <Icon name="x" size={22} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>
  )
}
