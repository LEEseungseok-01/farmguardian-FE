import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { Icon } from './Icon'

export function Toast() {
  const { toast } = useApp()
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <Icon name="check-circle" weight="fill" size={22} className="toast__icon" />
          <span className="toast__text">{toast.text}</span>
          {toast.actionTo && (
            <Link to={toast.actionTo} className="toast__action">
              {toast.actionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
