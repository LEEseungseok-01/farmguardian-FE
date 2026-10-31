/** 농사 장부에 찍는 도장. 둥근 테두리 안에 벼와 감자와 청년이 서 있다. */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      viewBox="23 0 186 186"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="logo-mark"
    >
      <circle cx="116" cy="93" r="88" style={{ fill: 'var(--logo-face)', stroke: 'var(--logo-line)' }} strokeWidth="4.6" />
      <circle cx="116" cy="93" r="78" fill="none" style={{ stroke: 'var(--logo-line)' }} strokeWidth="2.2" />
      <g
        style={{ stroke: 'var(--logo-draw)' }}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M52 56 C54 72 54 88 52 104" strokeWidth="3.2" />
        <path d="M52 58 C60 54 68 56 70 62 C64 67 56 65 52 60" style={{ fill: 'var(--logo-rice)' }} />
        <path d="M51 72 C59 68 67 70 69 76 C63 81 55 79 51 74" style={{ fill: 'var(--logo-rice)' }} />
        <path d="M51 86 C59 82 67 84 69 90 C63 95 55 93 51 88" style={{ fill: 'var(--logo-rice)' }} />

        <path d="M74 118 C68 94 80 74 102 73 C124 72 137 90 135 112 C134 118 132 122 129 126" style={{ fill: 'var(--logo-potato)' }} />
        <circle cx="92" cy="94" r="4.2" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
        <circle cx="114" cy="92" r="4.2" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
        <path d="M94 105 C101 113 112 112 117 103" />

        <path d="M138 126 C134 106 143 92 158 92 C173 92 181 106 177 126" style={{ fill: 'var(--logo-skin)' }} />
        <circle cx="150" cy="108" r="3.4" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
        <circle cx="166" cy="108" r="3.4" style={{ fill: 'var(--logo-draw)' }} stroke="none" />
        <path d="M152 116 C157 121 164 120 167 115" />
        <path d="M140 94 C143 82 173 82 176 94" style={{ fill: 'var(--logo-hat)' }} />
        <path d="M137 94 L179 94" strokeWidth="3.6" />

        <path d="M48 136 L184 136" strokeWidth="3.2" style={{ stroke: 'var(--logo-line)' }} />
        <path d="M58 146 L174 146" strokeWidth="2.6" strokeDasharray="2 10" style={{ stroke: 'var(--logo-line)' }} />
      </g>
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <LogoMark size={40} />
      <span className="wordmark__text">팜가디언</span>
    </span>
  )
}
