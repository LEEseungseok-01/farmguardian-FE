import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Point, Zone } from '../data/mock'

// 위성 지도처럼 보이도록 밭 조각을 격자로 흩뿌린다. 같은 결과가 나오도록 씨앗값을 고정한다.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Patch = { d: string; tone: number }

const TERRAIN: Patch[] = (() => {
  const rand = rng(11)
  const sx = 112
  const sy = 100
  const cols = 15
  const rows = 18
  const x0 = -560
  const y0 = -520
  const v: Point[][] = []
  for (let j = 0; j <= rows; j++) {
    v[j] = []
    for (let i = 0; i <= cols; i++) {
      v[j][i] = [x0 + i * sx + (rand() - 0.5) * 40 + j * 3, y0 + j * sy + (rand() - 0.5) * 34 - i * 4]
    }
  }
  const out: Patch[] = []
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]]
      out.push({ d: `M${p.map((q) => q.map((n) => n.toFixed(1)).join(' ')).join('L')}Z`, tone: 1 + Math.floor(rand() * 6) })
    }
  }
  return out
})()

const ROADS = [
  'M-600 132C-300 150-80 120 60 122S300 104 420 92 760 62 980 70',
  'M150 420C146 500 140 620 132 740S120 1000 126 1200',
  'M40 300C-80 310-260 340-600 350',
]
const STREAM = 'M980 300C760 290 540 236 420 252S376 380 384 476 300 650 252 770 180 1010 200 1200'

const centroid = (pts: Point[]): Point => {
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return [x, y]
}
const toPath = (pts: Point[]) => `M${pts.map((p) => p.join(' ')).join('L')}Z`

/** 이름 배지 폭 어림 (한글 16px 기준) */
const pillWidth = (s: string) =>
  [...s].reduce((w, ch) => w + (ch === ' ' ? 5 : /[가-힣]/.test(ch) ? 16 : 9.5), 0) + 26

type Props = {
  zones: Zone[]
  selectedId?: string
  onSelect?: (id: string) => void
  /** 구역에 마우스를 올리거나 뗄 때. 뗐을 때는 null */
  onHover?: (id: string | null) => void
  zoneLabel?: (z: Zone) => string
  style?: CSSProperties
  className?: string
  ariaLabel: string
}

export function FieldMap({ zones, selectedId, onSelect, onHover, zoneLabel, style, className, ariaLabel }: Props) {
  const interactive = !!(onSelect || onHover)
  const all = zones.flatMap((z) => z.points)
  const minX = Math.min(...all.map((p) => p[0]))
  const maxX = Math.max(...all.map((p) => p[0]))
  const minY = Math.min(...all.map((p) => p[1]))
  const maxY = Math.max(...all.map((p) => p[1]))
  const pad = 8
  const vbW = maxX - minX + pad * 2
  const vbH = maxY - minY + pad * 2
  const viewBox = `${minX - pad} ${minY - pad} ${vbW} ${vbH}`
  const ordered = [...zones].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))

  // 배지와 글자는 지도 배율과 상관없이 화면에서 같은 크기로 보이게 한다
  const ref = useRef<SVGSVGElement>(null)
  const [k, setK] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width && height) setK(Math.min(width / vbW, height / vbH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vbW, vbH])

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(id)
    }
  }

  return (
    <svg
      ref={ref}
      className={`field-map ${className ?? ''}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={style}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel || undefined}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <pattern id="crop-rows" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <rect width="7" height="7" className="map-rows-bg" />
          <line x1="0" y1="0" x2="0" y2="7" className="map-rows-line" strokeWidth="2.6" />
        </pattern>
      </defs>

      <g aria-hidden="true">
        {TERRAIN.map((p, i) => (
          <path key={i} d={p.d} className={`map-patch map-patch--${p.tone}`} />
        ))}
        {[220, 300, 380, 460, 540].map((r) => (
          <ellipse key={r} cx="640" cy="-40" rx={r * 1.3} ry={r * 0.8} className="map-contour" />
        ))}
        {[120, 190, 260].map((r) => (
          <ellipse key={r} cx="-200" cy="760" rx={r * 1.4} ry={r} className="map-contour" />
        ))}
        <path d={STREAM} className="map-stream" />
        {ROADS.map((d) => (
          <g key={d}>
            <path d={d} className="map-road-edge" />
            <path d={d} className="map-road" />
          </g>
        ))}
        <text x="300" y="82" className="map-label" style={{ fontSize: 15 / k, strokeWidth: 4 / k }} transform="rotate(-5 300 82)">선자령길</text>
        <text x="392" y="560" className="map-label map-label--water" style={{ fontSize: 15 / k, strokeWidth: 4 / k }} transform="rotate(-62 392 560)">횡계천</text>
      </g>

      {ordered.map((z) => {
        const sel = z.id === selectedId
        const [cx, cy] = centroid(z.points)
        const d = toPath(z.points)
        const label = zoneLabel ? zoneLabel(z) : z.crop
        return (
          <g
            key={z.id}
            className={`zone${sel ? ' is-selected' : ''}`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={onSelect ? sel : undefined}
            aria-label={interactive ? `${z.name}, ${label}` : undefined}
            onClick={() => onSelect?.(z.id)}
            onKeyDown={(e) => onKey(e, z.id)}
            onPointerEnter={(e) => e.pointerType === 'mouse' && onHover?.(z.id)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && onHover?.(null)}
            onFocus={() => onHover?.(z.id)}
            onBlur={() => onHover?.(null)}
          >
            <path d={d} fill="url(#crop-rows)" className="zone__rows" />
            <path d={d} className="zone__shape" vectorEffect="non-scaling-stroke" />
            <g className="zone__badge" transform={`translate(${cx} ${cy}) scale(${1 / k})`}>
              <rect
                x={-pillWidth(z.name) / 2}
                y={-17}
                width={pillWidth(z.name)}
                height={34}
                rx={17}
                className="zone__badge-dot"
              />
              <text y="5.5" textAnchor="middle" className="zone__badge-letter">{z.name}</text>
              <text y="38" textAnchor="middle" className="zone__badge-label">{label}</text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
