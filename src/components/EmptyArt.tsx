import './EmptyArt.css'

/**
 * 빈 화면과 긴 기다림에 쓰는 그림. 로고의 감자와 청년이 그대로 나와서 일을 한다.
 * 장식이 아니라 상태 표시다. 무엇이 없는지, 무엇을 하는 중인지를 동작으로 보인다.
 */
export type ArtKind = 'record' | 'search' | 'drug' | 'chart' | 'survey'

/** 로고에서 그대로 떼어 온 청년. 모자 쓰고 웃는다 */
function Youth() {
  return (
    <g transform="translate(-131 -78)">
      <path d="M138 126 C134 106 143 92 158 92 C173 92 181 106 177 126" style={{ fill: 'var(--logo-skin)' }} />
      <circle cx="150" cy="108" r="3.4" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
      <circle cx="166" cy="108" r="3.4" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
      <path d="M152 116 C157 121 164 120 167 115" />
      <path d="M140 94 C143 82 173 82 176 94" style={{ fill: 'var(--logo-hat)' }} />
      <path d="M137 94 L179 94" strokeWidth="3.6" />
    </g>
  )
}

/** 로고에서 그대로 떼어 온 감자 */
function Potato() {
  return (
    <g transform="translate(-64 -62)">
      <path
        d="M74 118 C68 94 80 74 102 73 C124 72 137 90 135 112 C134 118 132 122 129 126"
        style={{ fill: 'var(--logo-potato)' }}
      />
      <circle cx="92" cy="94" r="4.2" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
      <circle cx="114" cy="92" r="4.2" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
      <path d="M94 105 C101 113 112 112 117 103" />
    </g>
  )
}

const LABEL: Record<ArtKind, string> = {
  record: '청년이 빈 장부를 펴 놓고 기다리는 그림',
  search: '청년이 돋보기로 잎을 살피는 그림',
  drug: '감자가 빈 약봉지를 털어 보는 그림',
  chart: '감자가 빈 막대 앞에 선 그림',
  survey: '청년이 줄자로 밭을 재는 그림',
}

export function EmptyArt({ kind, size = 132 }: { kind: ArtKind; size?: number }) {
  return (
    <svg
      viewBox="0 0 140 112"
      width={size}
      height={(size * 112) / 140}
      role="img"
      aria-label={LABEL[kind]}
      className={`art art--${kind}`}
    >
      <g
        style={{ stroke: 'var(--logo-line)' }}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {kind === 'record' && (
          <>
            {/* 펼친 장부. 줄이 하나씩 그어진다 */}
            <path d="M10 44 L66 44 L66 96 L10 96 Z" style={{ fill: 'var(--surface)' }} />
            <path d="M38 44 L38 96" strokeWidth="2.4" />
            <g strokeWidth="2.6" className="art__line">
              <path d="M17 58 L31 58" />
              <path d="M17 70 L31 70" />
              <path d="M45 58 L59 58" />
            </g>
            <g className="art__hand">
              <g transform="translate(86 46)">
                <Youth />
              </g>
              {/* 연필 */}
              <path d="M70 74 L84 62" strokeWidth="4.2" style={{ stroke: 'var(--logo-hat)' }} />
              <path d="M66 78 L71 73" strokeWidth="4.2" />
            </g>
          </>
        )}

        {kind === 'search' && (
          <>
            {/* 잎 하나. 그 위를 돋보기가 훑는다 */}
            <path
              d="M28 88 C24 62 40 46 62 48 C62 70 48 88 28 88 Z"
              style={{ fill: 'var(--logo-rice)' }}
              strokeWidth="3.2"
            />
            <path d="M30 86 C40 74 50 62 60 50" strokeWidth="2.4" />
            <g transform="translate(96 44)">
              <Youth />
            </g>
            <g className="art__lens">
              <circle cx="52" cy="62" r="17" style={{ fill: 'var(--logo-face)', fillOpacity: 0.55 }} />
              <path d="M64 74 L76 86" strokeWidth="5" />
            </g>
          </>
        )}

        {kind === 'drug' && (
          <>
            <g transform="translate(40 50)">
              <Potato />
            </g>
            {/* 거꾸로 든 빈 봉지. 털어도 아무것도 안 나온다 */}
            <g className="art__pouch">
              <path d="M90 34 L120 34 L116 82 L94 82 Z" style={{ fill: 'var(--surface)' }} />
              <path d="M90 46 L119 46" strokeWidth="2.4" />
              <path d="M97 60 L112 60" strokeWidth="2.4" />
            </g>
            <g className="art__dust" strokeWidth="2.8">
              <path d="M101 92 L101 92" />
              <path d="M110 96 L110 96" />
            </g>
          </>
        )}

        {kind === 'chart' && (
          <>
            {/* 아직 아무것도 안 쌓인 막대 세 칸 */}
            <path d="M16 96 L124 96" strokeWidth="3" />
            <g strokeWidth="2.6" strokeDasharray="4 5" className="art__slot">
              <path d="M26 96 L26 70" />
              <path d="M46 96 L46 56" />
              <path d="M66 96 L66 44" />
            </g>
            <g transform="translate(98 48)">
              <Potato />
            </g>
          </>
        )}

        {kind === 'survey' && (
          <>
            {/* 점선 밭 위에서 줄자를 당긴다 */}
            <path
              d="M12 58 L104 50 L108 92 L16 98 Z"
              strokeWidth="2.6"
              strokeDasharray="5 6"
              style={{ fill: 'var(--logo-rice)', fillOpacity: 0.3 }}
            />
            <g transform="translate(104 34)">
              <Youth />
            </g>
            <g className="art__tape">
              <path d="M22 76 L92 70" strokeWidth="3.4" style={{ stroke: 'var(--logo-hat)' }} />
              <path d="M22 70 L22 82" strokeWidth="3.4" />
            </g>
          </>
        )}
      </g>
    </svg>
  )
}
