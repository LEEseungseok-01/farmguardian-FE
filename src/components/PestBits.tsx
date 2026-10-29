import { useState } from 'react'
import type { Pest } from '../data/mock'
import { Icon } from './Icon'

/** 열두 달 막대. 생기는 달은 옅게, 많이 생기는 달은 진하게, 이번 달은 표시한다. */
export function MonthBar({ pest, month }: { pest: Pest; month: number }) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const peak = pest.peak
  const range = `${Math.min(...peak)}~${Math.max(...peak)}월`
  return (
    <div className="monthbar">
      <div className="monthbar__track" aria-hidden="true">
        {months.map((m) => (
          <span
            key={m}
            className={[
              'monthbar__cell',
              pest.months.includes(m) ? 'is-on' : '',
              peak.includes(m) ? 'is-peak' : '',
              m === month ? 'is-now' : '',
            ].join(' ')}
          />
        ))}
      </div>
      <div className="monthbar__scale" aria-hidden="true">
        {months.map((m) => (
          <span key={m}>{m % 3 === 1 ? m : ''}</span>
        ))}
      </div>
      <span className="monthbar__label">많이 생기는 때 {range}</span>
    </div>
  )
}

export type SeasonLevel = 'high' | 'mid' | 'low'

export const seasonLevel = (pest: Pest, month: number): SeasonLevel =>
  pest.peak.includes(month) ? 'high' : pest.months.includes(month) ? 'mid' : 'low'

export const SEASON_TEXT: Record<SeasonLevel, string> = {
  high: '지금 많이 생겨요',
  mid: '지금 생길 수 있어요',
  low: '지금은 드물어요',
}

export function PestPhoto({ pest, size = 64 }: { pest: Pest; size?: number }) {
  // 밭에서는 통신이 약할 수 있어 사진이 안 오면 그림으로 대신한다
  const [failed, setFailed] = useState(false)
  return (
    <span className={`pest-photo pest-photo--${pest.kind === '벌레' ? 'bug' : 'disease'}`} style={{ width: size, height: size }}>
      {failed ? (
        <Icon name={pest.kind === '벌레' ? 'bug' : pest.kind === '바이러스' ? 'virus' : 'leaf'} size={Math.round(size * 0.45)} label={`${pest.name} 그림`} />
      ) : (
        <img
          src={pest.photo}
          alt={`${pest.name} 사진`}
          loading="lazy"
          width={size}
          height={size}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}
