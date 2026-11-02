import { useEffect, useState } from 'react'
import { FieldMap } from '../components/FieldMap'
import type { Farm, Zone } from '../data/mock'
import { api } from '../lib/api'
import { pointsOf } from '../lib/geo'
import { useApp } from '../state/AppState'

type Direction = 'crosswise' | 'lengthwise'
type Crop = { id: number; name: string }
type Piece = { area_m2: number; geometry: { coordinates: [number, number][][][] } }
type Draft = { name: string; cropId: number | null; plantedAt: string }

const MAX_ZONES = 6
const blank = (i: number): Draft => ({ name: `구역 ${i + 1}`, cropId: null, plantedAt: '' })

/** 가입 직후처럼 구역이 없는 밭을 나눈다. 같은 비율로 나누고 구역마다 이름·작물·심은 날을 받는다 */
export default function ZoneSetup({ farm }: { farm: Farm }) {
  const { reload, signOut } = useApp()
  const [count, setCount] = useState(1)
  const [direction, setDirection] = useState<Direction>('crosswise')
  const [drafts, setDrafts] = useState<Draft[]>([blank(0)])
  const [crops, setCrops] = useState<Crop[]>([])
  const [pieces, setPieces] = useState<Piece[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ratios = Array<number>(count).fill(1)

  useEffect(() => {
    api<Crop[]>('/crops').then(setCrops, (e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    api<Piece[]>(`/fields/${farm.id}/split-preview`, {
      method: 'POST',
      body: JSON.stringify({ direction, ratios: Array<number>(count).fill(1) }),
    }).then(setPieces, (e: Error) => setError(e.message))
  }, [farm.id, direction, count])

  const pick = (n: number) => {
    setCount(n)
    setDrafts((list) => Array.from({ length: n }, (_, i) => list[i] ?? blank(i)))
  }
  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts((list) => list.map((d, k) => (k === i ? { ...d, ...p } : d)))

  const mapZones: Zone[] = pieces.map((p, i) => ({
    id: `piece-${i}`,
    farmId: farm.id,
    name: String(i + 1),
    crop: '배추',
    plantedAt: null,
    harvestAt: null,
    areaM2: p.area_m2,
    points: pointsOf(p.geometry),
  }))

  const ready = drafts.every((d) => d.name.trim() && d.cropId)

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await api(`/fields/${farm.id}/zones`, {
        method: 'POST',
        body: JSON.stringify({
          direction,
          ratios,
          zones: drafts.map((d) => ({ name: d.name.trim(), crop_id: d.cropId, planted_at: d.plantedAt || null })),
        }),
      })
      reload()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="page page--cta">
      <div className="page__body find-step">
        <h1 className="section-heading">{farm.name} 구역 나누기</h1>
        <p className="find-step__label">밭을 몇 구역으로 나눌지, 구역마다 무엇을 심었는지 알려 주세요</p>

        <div className="locate">
          {mapZones.length > 0 && (
            <FieldMap zones={mapZones} ariaLabel="나눈 구역 미리 보기" className="locate__map" zoneLabel={() => ''} />
          )}
        </div>

        <div className="seg" role="group" aria-label="구역 수">
          {Array.from({ length: MAX_ZONES }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`seg__btn${n === count ? ' is-on' : ''}`}
              aria-pressed={n === count}
              onClick={() => pick(n)}
            >
              {n}
            </button>
          ))}
        </div>
        {count > 1 && (
          <div className="seg" role="group" aria-label="나누는 방향">
            {([['crosswise', '긴 쪽을 가로질러'], ['lengthwise', '긴 쪽을 따라']] as const).map(([d, label]) => (
              <button
                key={d}
                type="button"
                className={`seg__btn${d === direction ? ' is-on' : ''}`}
                aria-pressed={d === direction}
                onClick={() => setDirection(d)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {drafts.map((d, i) => (
          <div key={i} className="draft">
            <label className="field">
              <span className="field__label">구역 {i + 1} 이름</span>
              <input className="input" value={d.name} maxLength={30} onChange={(e) => patch(i, { name: e.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">작물</span>
              <select
                className="input"
                value={d.cropId ?? ''}
                onChange={(e) => patch(i, { cropId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">선택해 주세요</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">심은 날 (아직이면 비워 두세요)</span>
              <input type="date" className="input" value={d.plantedAt} onChange={(e) => patch(i, { plantedAt: e.target.value })} />
            </label>
          </div>
        ))}

        {error && (
          <p className="signup-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="cta-bar">
        <button type="button" className="btn btn--primary btn--lg" disabled={!ready || busy} onClick={save}>
          {busy ? '저장하는 중…' : '저장하기'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={signOut}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
