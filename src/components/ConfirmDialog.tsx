import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 가운데 뜨는 확인 창. 되돌릴 수 없는 일 앞에서만 쓴다. 열리면 창에 초점을 두고, Tab 첫 단추는 '취소'. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = '취소', danger, onConfirm, onCancel }: Props) {
  const id = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const cancelFn = useRef(onCancel)
  cancelFn.current = onCancel

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    boxRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancelFn.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="dialog-layer">
      <div className="sheet-scrim" onClick={onCancel} aria-hidden="true" />
      <div ref={boxRef} tabIndex={-1} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={id} aria-describedby={`${id}-d`}>
        <h2 id={id} className="dialog__title">{title}</h2>
        <div id={`${id}-d`} className="dialog__body">{children}</div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--soft" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
