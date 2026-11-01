import type { ReactElement } from 'react'
import type { Drug } from '../data/mock'
import { groupColor } from '../lib/verdict'

const LIQUID = ['액상수화제', '유제', '유상수화제', '액제']

/** 회사마다 다른 기하 도형 표시 (실제 상표 대신 쓰는 자리 표시) */
export function CompanyMark({ company, size = 20 }: { company: string; size?: number }) {
  const s = { fill: 'currentColor' }
  const glyph: Record<string, ReactElement> = {
    '(주)팜한농': (
      <>
        <circle cx="9" cy="12" r="6" style={s} />
        <circle cx="15" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      </>
    ),
    동방아그로: (
      <>
        <path d="M4 16a8 8 0 0 1 16 0Z" style={s} />
        <rect x="3" y="18" width="18" height="2.4" rx="1.2" style={s} />
      </>
    ),
    경농: <path d="m2.5 19 6.5-11 4 6.8 2.5-4.3 6 8.5Z" style={s} />,
    농협케미컬: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.4" transform="rotate(45 12 12)" />
        <circle cx="12" cy="12" r="3.4" style={s} />
      </>
    ),
    한국삼공: (
      <>
        <rect x="4" y="5" width="3.6" height="14" rx="1.8" style={s} />
        <rect x="10.2" y="8" width="3.6" height="11" rx="1.8" style={s} />
        <rect x="16.4" y="11" width="3.6" height="8" rx="1.8" style={s} />
      </>
    ),
    성보화학: <path d="M12 3.5 19.4 7.8v8.4L12 20.5l-7.4-4.3V7.8Z M12 8.4 8.6 10.3v3.4l3.4 2 3.4-2v-3.4Z" fillRule="evenodd" style={s} />,
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {glyph[company] ?? <circle cx="12" cy="12" r="7" style={s} />}
    </svg>
  )
}

/** 제형에 따라 병(액체) 또는 봉지(가루·알갱이)로 그린 약 그림. 띠 색은 계통 색. */
export function ProductArt({ drug, size = 44 }: { drug: Drug; size?: number }) {
  const band = { fill: groupColor(drug.group) }
  const liquid = LIQUID.includes(drug.form)
  const h = Math.round(size * 1.15)
  return (
    <span className="product-art" style={{ width: size, height: h }}>
      <svg viewBox="0 0 40 46" width={size} height={h} aria-hidden="true" focusable="false">
        {liquid ? (
          <>
            <rect x="14" y="1.5" width="12" height="6" rx="2" className="pa-cap" />
            <path d="M15.5 7.5h9v3.2c0 1 .6 1.8 1.4 2.3l4.1 2.6c1.9 1.2 3 3.2 3 5.4V40a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V21c0-2.2 1.1-4.2 3-5.4l4.1-2.6c.8-.5 1.4-1.3 1.4-2.3Z" className="pa-body" />
            <rect x="7" y="23" width="26" height="15" style={band} />
          </>
        ) : (
          <>
            <path d="M5 6.5 8.5 3l3.5 3.5L15.5 3 19 6.5 22.5 3 26 6.5 29.5 3 33 6.5 35 4.5V40a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" className="pa-body" />
            <rect x="5" y="22" width="30" height="16" style={band} />
          </>
        )}
        <circle cx="20" cy="30" r="5.4" className="pa-seal" />
      </svg>
      <span className="product-art__mark">
        <CompanyMark company={drug.company} size={Math.round(size * 0.2)} />
      </span>
    </span>
  )
}
