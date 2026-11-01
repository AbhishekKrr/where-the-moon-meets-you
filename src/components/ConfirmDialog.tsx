import { useRef } from 'react'
import { useModal } from '../lib/useModal'

type Props = {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, onCancel)
  return <div className="modal-backdrop" onClick={onCancel}>
    <div ref={ref} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" onClick={(event) => event.stopPropagation()}>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-body">{body}</p>
      <div className="confirm-actions">
        <button className="ghost-button" onClick={onCancel} data-autofocus>Cancel</button>
        <button className="soft-button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
}
