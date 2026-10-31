import './FeatureArt.css'

/** 랜딩에서 네 가지를 설명하는 그림. 글자 대신 물건이 움직여서 무엇을 하는지 보인다 */
export type FeatureKind = 'scan' | 'harvest' | 'count' | 'rotate'

const LABEL: Record<FeatureKind, string> = {
  scan: '약봉지 위를 빛줄기가 훑는 그림',
  harvest: '달력에서 수확할 날이 켜지는 그림',
  count: '막대 세 칸이 차례로 차는 그림',
  rotate: '두 약을 번갈아 쓰도록 화살표가 도는 그림',
}

export function FeatureArt({ kind, size = 72 }: { kind: FeatureKind; size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} role="img" aria-label={LABEL[kind]} className={`fart fart--${kind}`}>
      <g
        style={{ stroke: 'var(--logo-line)' }}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {kind === 'scan' && (
          <>
            {/* 윗면을 눌러 붙인 약봉지. 가운데 상표 칸 */}
            <path d="M25 14 L55 14 L53 68 L27 68 Z" style={{ fill: 'var(--surface)' }} />
            <path d="M25 24 L55 24" strokeWidth="2.4" />
            <g strokeWidth="1.8" style={{ stroke: 'var(--logo-line)' }}>
              <path d="M31 15 L31 23" />
              <path d="M37 15 L37 23" />
              <path d="M43 15 L43 23" />
              <path d="M49 15 L49 23" />
            </g>
            <path d="M31 34 L49 34 L49 50 L31 50 Z" strokeWidth="2.4" style={{ fill: 'var(--logo-rice)' }} />
            <path className="fart__beam" d="M16 42 L64 42" strokeWidth="3.4" style={{ stroke: 'var(--logo-hat)' }} />
          </>
        )}

        {kind === 'harvest' && (
          <>
            <path d="M14 22 L66 22 L66 66 L14 66 Z" style={{ fill: 'var(--surface)' }} />
            <path d="M14 34 L66 34" strokeWidth="2.4" />
            <path d="M26 14 L26 26" />
            <path d="M54 14 L54 26" />
            <g className="fart__days" strokeWidth="5" strokeLinecap="round">
              <path d="M26 46 L26 46" />
              <path d="M40 46 L40 46" />
              <path d="M54 46 L54 46" />
            </g>
            <circle className="fart__day" cx="40" cy="58" r="7" style={{ fill: 'var(--logo-rice)' }} strokeWidth="2.6" />
          </>
        )}

        {kind === 'count' && (
          <>
            <path d="M12 66 L68 66" strokeWidth="3.2" />
            <g className="fart__bars">
              <path d="M24 66 L24 46" strokeWidth="9" style={{ stroke: 'var(--logo-rice)' }} />
              <path d="M40 66 L40 38" strokeWidth="9" style={{ stroke: 'var(--logo-rice)' }} />
              <path d="M56 66 L56 30" strokeWidth="9" style={{ stroke: 'var(--logo-hat)' }} />
            </g>
          </>
        )}

        {kind === 'rotate' && (
          <>
            {/* 계통이 다른 약 둘. 번갈아 쓰라고 화살표가 오간다 */}
            <path d="M17 20 L35 20 L33 54 L19 54 Z" style={{ fill: 'var(--surface)' }} strokeWidth="2.8" />
            <path d="M17 28 L35 28" strokeWidth="2" />
            <path d="M45 20 L63 20 L61 54 L47 54 Z" style={{ fill: 'var(--logo-rice)' }} strokeWidth="2.8" />
            <path d="M45 28 L63 28" strokeWidth="2" />
            <g strokeWidth="1.6">
              <path d="M22 21 L22 27" /><path d="M26 21 L26 27" /><path d="M30 21 L30 27" />
              <path d="M50 21 L50 27" /><path d="M54 21 L54 27" /><path d="M58 21 L58 27" />
            </g>
            <g className="fart__swap">
              <path d="M28 64 C36 70 44 70 52 64" strokeWidth="3" style={{ stroke: 'var(--logo-hat)' }} />
              <path d="M52 58 L53 65 L46 65" strokeWidth="3" style={{ stroke: 'var(--logo-hat)' }} />
            </g>
          </>
        )}
      </g>
    </svg>
  )
}
