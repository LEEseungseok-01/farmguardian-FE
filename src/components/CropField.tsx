import { useMemo, useState } from 'react'
import { CROPS, POPULAR_CROPS, type Crop } from '../data/mock'
import { matchKo } from '../lib/korean'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

type Props = {
  value: Crop | null
  /** 목록에서 고르고 정하기를 눌렀을 때 */
  onPick: (c: Crop) => void
  label?: string
}

/** 작물 칸: 누르면 검색 목록이 열리고, 고른 뒤 정하기로 정한다. */
export function CropField({ value, onPick, label = '작물' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`select-row${value ? '' : ' is-empty'}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="select-row__label">{label}</span>
        <span className="select-row__value">{value ?? '선택해 주세요'}</span>
        <Icon name="caret-right" size={20} />
      </button>
      {open && (
        <CropSheet
          initial={value}
          onClose={() => setOpen(false)}
          onDone={(c) => {
            setOpen(false)
            if (c !== value) onPick(c)
          }}
        />
      )}
    </>
  )
}

function CropSheet({ initial, onClose, onDone }: { initial: Crop | null; onClose: () => void; onDone: (c: Crop) => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Crop | null>(initial)
  const query = q.trim()
  const results = useMemo(() => CROPS.filter((c) => matchKo(c, query)), [query])
  const rest = [...CROPS].filter((c) => !POPULAR_CROPS.includes(c)).sort((a, b) => a.localeCompare(b, 'ko'))

  const row = (c: Crop) => (
    <li key={c}>
      <button
        type="button"
        role="option"
        aria-selected={sel === c}
        className={`crop-row${sel === c ? ' is-on' : ''}`}
        onClick={() => setSel(c)}
      >
        <span>{c}</span>
        {sel === c && <Icon name="check" size={22} />}
      </button>
    </li>
  )

  return (
    <Sheet
      open
      tall
      onClose={onClose}
      title="작물 선택"
      footer={
        <button type="button" className="btn btn--primary btn--lg" disabled={!sel} onClick={() => sel && onDone(sel)}>
          {sel ? `${sel}로 정하기` : '작물 고르기'}
        </button>
      }
    >
      <label className="search crop-search">
        <Icon name="magnifying-glass" size={22} />
        <span className="sr-only">작물 검색</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="작물 검색 (예: 배추, ㅂㅊ)"
          enterKeyHint="search"
          data-autofocus
        />
        {q && (
          <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="검색어 지우기">
            <Icon name="x" size={18} />
          </button>
        )}
      </label>

      {query ? (
        results.length ? (
          <ul className="crop-list" role="listbox" aria-label="검색 결과">
            {results.map(row)}
          </ul>
        ) : (
          <p className="muted-box crop-empty">‘{query}’ 검색 결과가 없어요</p>
        )
      ) : (
        <>
          <p className="crop-group">고랭지에서 많이 심어요</p>
          <ul className="crop-list" role="listbox" aria-label="많이 심는 작물">
            {POPULAR_CROPS.map(row)}
          </ul>
          <p className="crop-group">전체 작물</p>
          <ul className="crop-list" role="listbox" aria-label="전체 작물">
            {rest.map(row)}
          </ul>
        </>
      )}
    </Sheet>
  )
}
