import { useMemo, useState, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { CustomIcon, Icon } from '../components/Icon'
import { MonthBar, PestPhoto, SEASON_TEXT, seasonLevel } from '../components/PestBits'
import { Sheet } from '../components/Sheet'
import { PESTS, pestById, zoneName, type Part, type Pest } from '../data/mock'
import { monthOf } from '../lib/date'
import { josa } from '../lib/korean'
import { registeredDrugs } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './PestSelect.css'
import { EmptyArt } from '../components/EmptyArt'

const PARTS: { key: Part; icon: ReactElement }[] = [
  { key: '잎', icon: <Icon name="leaf" size={30} /> },
  { key: '줄기', icon: <CustomIcon name="stem" size={30} /> },
  { key: '뿌리', icon: <CustomIcon name="root" size={30} /> },
  { key: '열매', icon: <CustomIcon name="fruit" size={30} /> },
]

export default function PestSelect() {
  const navigate = useNavigate()
  const { zone, pest: current, selectPest, today } = useApp()
  const [part, setPart] = useState<Part | null>(null)
  const [q, setQ] = useState('')
  const [info, setInfo] = useState<Pest | null>(null)
  const month = monthOf(today)

  const list = useMemo(() => {
    const query = q.trim()
    return PESTS.filter((p) => p.crops.includes(zone.crop))
      .filter((p) => !part || p.parts.includes(part))
      .filter((p) => !query || p.name.includes(query))
      .sort((a, b) => {
        const rank = { high: 0, mid: 1, low: 2 }
        return rank[seasonLevel(a, month)] - rank[seasonLevel(b, month)]
      })
  }, [zone.crop, part, q, month])

  const choose = (p: Pest) => {
    if (p.kind === '바이러스' || p.carries) {
      setInfo(p)
      return
    }
    selectPest(p.id)
    navigate('/drugs')
  }

  const goDrugs = (id: string) => {
    selectPest(id)
    setInfo(null)
    navigate('/drugs')
  }

  return (
    <div className="page page--nav">
      <AppBar title="병해충 선택" sub={`${zoneName(zone)} ${zone.crop}`} />

      <div className="page__body pest-page">
        <label className="search">
          <Icon name="magnifying-glass" size={22} />
          <span className="sr-only">해충 이름 검색</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="해충 이름 검색 (예: 진딧물)"
            enterKeyHint="search"
          />
          {q && (
            <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="검색어 지우기">
              <Icon name="x" size={18} />
            </button>
          )}
        </label>

        <section aria-labelledby="part-title">
          <h2 id="part-title" className="section-heading section-heading--sm">어디에 증상이 있나요?</h2>
          <div className="part-grid" role="group" aria-label="증상 부위">
            {PARTS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`part-btn${part === p.key ? ' is-on' : ''}`}
                aria-pressed={part === p.key}
                onClick={() => setPart(part === p.key ? null : p.key)}
              >
                {p.icon}
                <span>{p.key}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="pest-list-head">
          <p>
            <strong>{zone.crop}</strong>에 생기는 병해충 <strong>{list.length}</strong>종
          </p>
          {part && (
            <button type="button" className="chip chip--on" onClick={() => setPart(null)}>
              {part}
              <Icon name="x" size={16} />
              <span className="sr-only">부위 조건 지우기</span>
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <EmptyArt kind="search" />
            <p>{q || part ? '검색 결과가 없어요' : `아직 ${zone.crop} 병해충 자료가 없어요`}</p>
            {(q || part) && <p className="empty__hint">{q ? '이름을 줄여 보세요' : '부위를 풀어 보세요'}</p>}
          </div>
        ) : (
          <ul className="pest-list">
            {list.map((p) => {
              const lv = seasonLevel(p, month)
              const count = registeredDrugs(zone, p).length
              const on = p.id === current?.id
              return (
                <li key={p.id}>
                  <button type="button" className={`pest-card${on ? ' is-on' : ''}`} onClick={() => choose(p)}>
                    <PestPhoto pest={p} size={76} />
                    <span className="pest-card__body">
                      <span className="pest-card__title">
                        <span className="pest-card__name">{p.name}</span>
                        <span className={`kind-tag kind-tag--${p.kind === '벌레' ? 'bug' : p.kind === '병' ? 'disease' : 'virus'}`}>
                          {p.kind}
                        </span>
                        {on && <span className="pest-card__current">선택됨</span>}
                      </span>
                      <span className={`season season--${lv}`}>
                        <Icon name={lv === 'high' ? 'trend-up' : lv === 'mid' ? 'calendar-blank' : 'minus'} size={16} />
                        {SEASON_TEXT[lv]}
                      </span>
                      <MonthBar pest={p} month={month} />
                      <span className="pest-card__meta">
                        {p.kind === '바이러스' ? '약으로 고칠 수 없음' : `쓸 수 있는 약 ${count}개`}
                      </span>
                    </span>
                    <Icon name="caret-right" size={20} className="pest-card__chev" />
                  </button>
                  {p.carries && (
                    <p className="vector-note">
                      <Icon name="virus" size={18} />
                      바이러스를 옮기는 벌레예요
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <VirusSheet pest={info} onClose={() => setInfo(null)} onGo={goDrugs} />
      <BottomNav />
    </div>
  )
}

function VirusSheet({ pest, onClose, onGo }: { pest: Pest | null; onClose: () => void; onGo: (id: string) => void }) {
  if (!pest) return null
  const isVirus = pest.kind === '바이러스'
  const carrier = isVirus && pest.carrier ? pestById(pest.carrier) : undefined
  return (
    <Sheet
      open
      onClose={onClose}
      title={isVirus ? '바이러스병은 약으로 못 고쳐요' : `${josa(pest.name, '은', '는')} 바이러스를 옮겨요`}
      footer={
        <div className="sheet-actions">
          {isVirus ? (
            carrier && (
              <button type="button" className="btn btn--primary btn--lg" onClick={() => onGo(carrier.id)}>
                옮기는 벌레({carrier.name}) 약 보기
              </button>
            )
          ) : (
            <button type="button" className="btn btn--primary btn--lg" onClick={() => onGo(pest.id)}>
              벌레 잡는 약 보기
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      }
    >
      <div className="virus-info">
        <div className="virus-info__hero">
          <PestPhoto pest={pest} size={64} />
          <div>
            <p className="virus-info__name">{pest.name}</p>
            <p className="virus-info__hint">{pest.hint}</p>
          </div>
        </div>
        <ul className="virus-info__list">
          {isVirus ? (
            <>
              <li><Icon name="prohibit" size={22} />걸린 포기는 약을 뿌려도 낫지 않아요.</li>
              <li><Icon name="shovel" size={22} />걸린 포기는 일찍 뽑아서 밭 밖에서 없애 주세요.</li>
              <li><Icon name="bug" size={22} />바이러스를 옮기는 진딧물을 미리 막아야 번지지 않아요.</li>
            </>
          ) : (
            <>
              <li><Icon name="virus" size={22} />옮기는 바이러스: {pest.carries}</li>
              <li><Icon name="prohibit" size={22} />바이러스에 걸린 포기는 약으로 못 고쳐요.</li>
              <li><Icon name="shield-check" size={22} />벌레를 일찍 잡으면 바이러스가 번지는 걸 막을 수 있어요.</li>
            </>
          )}
        </ul>
      </div>
    </Sheet>
  )
}
