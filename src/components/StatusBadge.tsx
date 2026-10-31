import { STATUS_META, type Status } from '../lib/verdict'

export function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'md' | 'lg' }) {
  return <span className={`badge badge--${status} badge--${size}`}>{STATUS_META[status].label}</span>
}
