import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { GroupChip, RepeatChip } from '../components/DrugCard'
import { Icon } from '../components/Icon'
import { ProductArt } from '../components/ProductArt'
import { Sheet } from '../components/Sheet'
import { DRUGS, drugOf, zoneName, type Drug, type SprayRecord } from '../data/mock'
import { api } from '../lib/api'
import { toDrug, type ServerPesticide } from '../lib/serverVerdict'
import { fmtMD, monthOf, weekday } from '../lib/date'
import { groupLabel } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './History.css'
import { EmptyArt } from '../components/EmptyArt'

export default function History() {
  const { records, farmZones, zones, setRecordCancelled, today, showToast, zone: currentZone, pestById } = useApp()
  const [filter, setFilter] = useState<string>('all')
  const [confirm, setConfirm] = useState<SprayRecord | null>(null)
  const [adding, setAdding] = useState(false)

  const zoneIds = farmZones.map((z) => z.id)
  const list = useMemo(
    () =>
      records
        .filter((r) => zoneIds.includes(r.zoneId) && (filter === 'all' || r.zoneId === filter))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [records, zoneIds, filter],
  )
  const active = list.filter((r) => !r.cancelled)
  const byMonth = list.reduce<Record<number, SprayRecord[]>>((acc, r) => {
    ;(acc[monthOf(r.date)] ||= []).push(r)
    return acc
  }, {})
  const months = Object.keys(byMonth).map(Number).sort((a, b) => b - a)

  const zoneOf = (id: string) => zones.find((z) => z.id === id)!

  /** 같은 구역에서 바로 앞에 쓴 약과 계통이 같으면 true */
  const repeatsGroup = (r: SprayRecord) => {
    const g = drugOf(r)?.group
    if (!g) return false
    const prev = active.find(
      (x) => x.zoneId === r.zoneId && (x.date < r.date || (x.date === r.date && x.id < r.id)),
    )
    return !!prev && drugOf(prev)?.group === g
  }

  return (
    <div className="page page--nav page--fab">
      <AppBar title="살포 이력" />

      <div className="page__body history-page">
        <div className="zone-tabs" role="group" aria-label="구역 거르기">
          <button
            type="button"
            className={`chip${filter === 'all' ? ' chip--on' : ''}`}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          {farmZones.map((z) => (
            <button
              key={z.id}
              type="button"
              className={`chip${filter === z.id ? ' chip--on' : ''}`}
              aria-pressed={filter === z.id}
              onClick={() => setFilter(z.id)}
            >
              {zoneName(z)}
            </button>
          ))}
        </div>

        <p className="hist-sum">
          올해 <strong>{active.length}회</strong> 뿌렸어요
        </p>

        {list.length === 0 ? (
          <div className="empty">
            <EmptyArt kind="record" />
            <p>아직 기록이 없어요</p>
            <p className="empty__hint">판정 화면에서 기록할 수 있어요</p>
          </div>
        ) : (
          months.map((m) => (
            <section key={m} className="rec-month" aria-labelledby={`m-${m}`}>
              <h2 id={`m-${m}`} className="rec-month__title">{m}월</h2>
              <ul className="rec-list">
                {byMonth[m].map((r) => {
                  const d = drugOf(r)!
                  const p = pestById(r.pestId)
                  const z = zoneOf(r.zoneId)
                  return (
                    <li key={r.id} className={`rec${r.cancelled ? ' is-cancelled' : ''}`}>
                      <div className="rec__date">
                        <strong>{+r.date.slice(8, 10)}일</strong>
                        <span>{weekday(r.date)}요일</span>
                      </div>
                      <ProductArt drug={d} size={36} />
                      <div className="rec__body">
                        <p className="rec__name">
                          <span className="rec__strike">{d.name}</span>
                        </p>
                        <p className="rec__meta rec__strike">
                          <span>{zoneName(z)}</span>
                          <span>{p?.name}</span>
                        </p>
                        <p className="rec__tags">
                          <GroupChip group={d.group} warn={!r.cancelled && repeatsGroup(r)} />
                          {!r.cancelled && repeatsGroup(r) && <RepeatChip />}
                          {r.cancelled && <span className="tag tag--cancel">취소됨</span>}
                          {r.manual && <span className="tag">직접 적음</span>}
                        </p>
                      </div>
                      {r.cancelled ? (
                        <button
                          type="button"
                          className="rec__btn rec__btn--icon"
                          aria-label={`${d.name} 기록 되돌리기`}
                          onClick={async () => {
                            if (await setRecordCancelled(r.id, false)) showToast({ text: '기록을 되돌렸어요' })
                          }}
                        >
                          <Icon name="arrow-counter-clockwise" size={22} />
                        </button>
                      ) : (
                        <button type="button" className="rec__btn rec__btn--danger" onClick={() => setConfirm(r)}>
                          취소
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="fab-bar">
        <button type="button" className="btn btn--primary btn--lg" onClick={() => setAdding(true)}>
          <Icon name="plus" size={22} />
          지난 기록 추가
        </button>
      </div>

      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="이 기록을 취소할까요?"
        footer={
          <div className="sheet-actions">
            <button
              type="button"
              className="btn btn--danger btn--lg"
              onClick={async () => {
                const ok = !confirm || (await setRecordCancelled(confirm.id, true))
                setConfirm(null)
                if (ok) showToast({ text: '기록을 취소했어요' })
              }}
            >
              취소하기
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)} data-autofocus>
              닫기
            </button>
          </div>
        }
      >
        {confirm && (
          <div className="confirm-box">
            <p className="confirm-box__title">
              <span>{fmtMD(confirm.date)}</span>
              <span>{zoneName(zoneOf(confirm.zoneId))}</span>
            </p>
            <p>
              {drugOf(confirm)?.name}, {pestById(confirm.pestId)?.name}
            </p>
            <p className="confirm-box__note">
              <Icon name="info" size={18} />
              취소한 기록은 줄을 그어 남겨 두고, 판정에는 쓰지 않아요.
            </p>
          </div>
        )}
      </Sheet>

      {adding && (
        <AddRecordSheet
          onClose={() => setAdding(false)}
          today={today}
          defaultZone={filter !== 'all' ? filter : currentZone.id}
        />
      )}
      <BottomNav />
    </div>
  )
}

function AddRecordSheet({ onClose, today, defaultZone }: { onClose: () => void; today: string; defaultZone: string }) {
  const { user, farmZones, addRecord, showToast, pests } = useApp()
  const [zoneId, setZoneId] = useState(defaultZone)
  const zone = farmZones.find((z) => z.id === zoneId) ?? farmZones[0]
  const zonePests = pests.filter((p) => p.crops.includes(zone.crop) && p.kind !== '바이러스')
  const [date, setDate] = useState(today)
  const [pestId, setPestId] = useState(zonePests[0]?.id ?? '')
  const validPest = zonePests.some((p) => p.id === pestId) ? pestId : zonePests[0]?.id ?? ''
  // 로그인했다면 이 작물·병해충에 등록된 약을 BE에서 받는다 (그 밖의 약 목록은 없다)
  const [served, setServed] = useState<Drug[]>([])
  useEffect(() => {
    if (!user || !zone.cropId || !validPest) return
    let stale = false
    api<ServerPesticide[]>(`/pesticides?crop_id=${zone.cropId}&pest_id=${validPest}`).then(
      (r) => !stale && setServed(r.map(toDrug)),
      () => !stale && setServed([]),
    )
    return () => {
      stale = true
    }
  }, [user, zone.cropId, validPest])
  const drugs = user ? served : DRUGS.filter((d) => d.regs.some((x) => x.crop === zone.crop && x.pestId === validPest))
  const others = user ? [] : DRUGS.filter((d) => !drugs.includes(d))
  const [drugId, setDrugId] = useState('')
  const validDrug = [...drugs, ...others].some((d) => d.id === drugId) ? drugId : drugs[0]?.id ?? ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validDrug || !validPest) return
    if (await addRecord({ date, zoneId: zone.id, drugId: validDrug, pestId: validPest, manual: true })) {
      showToast({ text: `${fmtMD(date)} 기록을 추가했어요` })
      onClose()
    }
  }

  return (
    <Sheet
      open
      tall
      onClose={onClose}
      title="지난 기록 추가"
      sub="앱을 쓰기 전에 뿌린 것도 넣으면 판정이 더 정확해져요"
      footer={
        <button type="submit" form="add-record" className="btn btn--primary btn--lg" disabled={!validDrug}>
          저장하기
        </button>
      }
    >
      <form id="add-record" className="form" onSubmit={submit}>
        <div className="field">
          <span className="field__label" id="f-zone">구역</span>
          <div className="seg" role="radiogroup" aria-labelledby="f-zone">
            {farmZones.map((z) => (
              <button
                key={z.id}
                type="button"
                role="radio"
                aria-checked={z.id === zone.id}
                className={`seg__btn${z.id === zone.id ? ' is-on' : ''}`}
                onClick={() => setZoneId(z.id)}
              >
                {zoneName(z)}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">뿌린 날</span>
          <input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
          <span className="field__hint">실제로 뿌린 날을 넣어 주세요.</span>
        </label>

        <label className="field">
          <span className="field__label">병해충</span>
          <select className="input" value={validPest} onChange={(e) => setPestId(e.target.value)}>
            {zonePests.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">약</span>
          <select className="input" value={validDrug} onChange={(e) => setDrugId(e.target.value)}>
            <optgroup label="이 병해충에 등록된 약">
              {drugs.map((d) => (
                <option key={d.id} value={d.id}>{d.name} {d.form} (그룹 {groupLabel(d.group)})</option>
              ))}
            </optgroup>
            {others.length > 0 && (
              <optgroup label="그 밖의 약">
                {others.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} {d.form} (그룹 {groupLabel(d.group)})</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </form>
    </Sheet>
  )
}
