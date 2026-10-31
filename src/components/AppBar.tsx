import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

export function AppBar({ title, sub, right, fallback = '/map' }: { title: string; sub?: string; right?: ReactNode; fallback?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const back = () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
  return (
    <header className="appbar">
      <button type="button" className="icon-btn" onClick={back} aria-label="뒤로 가기">
        <Icon name="arrow-left" size={24} />
      </button>
      <div className="appbar__titles">
        <h1 className="appbar__title">{title}</h1>
        {sub && <p className="appbar__sub">{sub}</p>}
      </div>
      {right && <div className="appbar__right">{right}</div>}
    </header>
  )
}
