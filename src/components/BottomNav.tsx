import { NavLink } from 'react-router-dom'
import type { IconName } from './iconPaths'
import { Icon } from './Icon'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/map', label: '지도', icon: 'map-trifold' },
  { to: '/drugs', label: '약', icon: 'seal-check' },
  { to: '/history', label: '이력', icon: 'clock-counter-clockwise' },
  { to: '/dashboard', label: '통계', icon: 'chart-pie-slice' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주요 화면">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className="bottom-nav__item">
          {({ isActive }) => (
            <>
              <Icon name={t.icon} size={26} weight={isActive ? 'fill' : 'regular'} />
              <span>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
