import { ICONS, type IconName } from './iconPaths'

type Props = {
  name: IconName
  size?: number
  weight?: 'regular' | 'fill'
  className?: string
  /** 의미가 있는 아이콘일 때만 넣는다. 없으면 화면 읽기 프로그램에서 숨긴다. */
  label?: string
}

export function Icon({ name, size = 24, weight = 'regular', className, label }: Props) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      className={className ? `icon ${className}` : 'icon'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={ICONS[name][weight]} />
    </svg>
  )
}

/** Phosphor 에 없는 그림은 같은 선 굵기(16)로 직접 그린다 */
type CustomName = 'stem' | 'root' | 'fruit' | 'kakao'

export function CustomIcon({ name, size = 24, className }: { name: CustomName; size?: number; className?: string }) {
  const common = {
    viewBox: '0 0 256 256',
    width: size,
    height: size,
    className: className ? `icon ${className}` : 'icon',
    'aria-hidden': true,
    focusable: 'false' as const,
  }
  if (name === 'kakao') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M128 36C66.1 36 16 75.4 16 124c0 31.2 20.7 58.6 51.9 74.2l-11.7 43.1a5 5 0 0 0 7.6 5.4l51.4-34c4.2.4 8.5.6 12.8.6 61.9 0 112-39.4 112-88S189.9 36 128 36Z" />
      </svg>
    )
  }
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 16, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'stem') {
    return (
      <svg {...common}>
        <g {...stroke}>
          <path d="M128 224V88" />
          <path d="M128 160c-30 0-58-20-64-56 34 0 58 20 64 56Z" />
          <path d="M128 120c6-36 32-56 68-56-6 36-32 56-68 56Z" />
          <path d="M96 224h64" />
        </g>
      </svg>
    )
  }
  if (name === 'root') {
    return (
      <svg {...common}>
        <g {...stroke}>
          <path d="M32 96h192" />
          <path d="M128 32v64" />
          <path d="M104 48c8 0 24 8 24 24" />
          <path d="M128 96v120" />
          <path d="M128 128c-24 8-44 28-52 64" />
          <path d="M128 128c24 8 44 28 52 64" />
          <path d="M128 168c-10 8-18 20-20 36" />
          <path d="M128 168c10 8 18 20 20 36" />
        </g>
      </svg>
    )
  }
  return (
    <svg {...common}>
      <g {...stroke}>
        <path d="M128 92c-48 0-80 32-80 72s36 60 80 60 80-20 80-60-32-72-80-72Z" />
        <path d="M128 92c0-20 8-40 28-56" />
        <path d="M128 76c-24-2-44-16-52-40 24 2 44 16 52 40Z" />
        <path d="M96 156h.01M150 140h.01M140 186h.01" strokeWidth={20} />
      </g>
    </svg>
  )
}
