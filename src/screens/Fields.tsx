import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CropField } from '../components/CropField'
import { FieldMap } from '../components/FieldMap'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { ADDRESS_BOOK, type Crop, type Zone } from '../data/mock'
import { diffDays, num, toPyeong } from '../lib/date'
import { eul, josa, ro } from '../lib/korean'
import { useApp } from '../state/AppState'
import './Fields.css'

type Pending =
  | { type: 'crop'; zone: Zone; crop: Crop; count: number }
  | { type: 'delete'; zone: Zone; count: number }

export default function Fields() {
  const navigate = useNavigate()
  // 구역 카드는 가로로 한 장씩 넘긴다. 위 칩이 지금 보는 카드를 가리킨다
  const listRef = useRef<HTMLUListElement>(null)
  const [shown, setShown] = useState(0)
  const goZone = (i: number) =>
    listRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  const onZoneScroll = () => {
    const el = listRef.current
    if (!el) return
    const mid = el.scrollLeft + el.clientWidth / 2
    const i = [...el.children].findIndex(
      (k) => (k as HTMLElement).offsetLeft <= mid && mid < (k as HTMLElement).offsetLeft + (k as HTMLElement).offsetWidth,
    )
    if (i >= 0) setShown(i)
  }
  const { farms, zones, records, currentFarm, setCurrentFarm, updateZone, changeCrop, deleteZone, today, showToast } = useApp()
  const [finding, setFinding] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const farmZones = zones.filter((z) => z.farmId === currentFarm.id)
  const countOf = (id: string) => records.filter((r) => r.zoneId === id).length

  const confirm = () => {
    if (!pending) return
    if (pending.type === 'crop') {
      changeCrop(pending.zone.id, pending.crop)
      showToast({ text: `${josa(pending.zone.name, '은', '는')} 이제 ${pending.crop} 구역이에요` })
    } else {
      deleteZone(pending.zone.id)
      showToast({ text: `${eul(pending.zone.name)} 삭제했어요` })
    }
    setPending(null)
  }

  return (
    <div className="page page--cta">
      <AppBar title="밭 관리" />

      <div className="page__body fields-page">
        <section aria-labelledby="farms-title">
          <h2 id="farms-title" className="section-heading section-heading--sm">내 밭</h2>
          <ul className="farm-list" role="radiogroup" aria-labelledby="farms-title">
            {farms.map((f) => {
              const zs = zones.filter((z) => z.farmId === f.id)
              const area = zs.reduce((a, z) => a + z.areaM2, 0)
              const on = f.id === currentFarm.id
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`farm-item${on ? ' is-on' : ''}`}
                    onClick={() => setCurrentFarm(f.id)}
                  >
                    <span className="farm-item__thumb" aria-hidden="true">
                      <FieldMap zones={zs} ariaLabel="" className="farm-item__map" />
                    </span>
                    <span className="farm-item__body">
                      <span className="farm-item__name">{f.name}</span>
                      <span className="farm-item__addr">{f.address}</span>
                      <span className="farm-item__meta">
                        {[...new Set(zs.map((z) => z.crop))].join(', ')} {num(toPyeong(area))}평
                      </span>
                    </span>
                    <span className="farm-item__radio" aria-hidden="true">
                      {on && <Icon name="check" size={16} />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <button type="button" className="btn btn--outline add-farm" onClick={() => setFinding(true)}>
            <Icon name="magnifying-glass" size={22} />
            내 밭 찾기
          </button>
        </section>

        <section aria-labelledby="zones-title">
          <h2 id="zones-title" className="section-heading section-heading--sm">
            구역 {farmZones.length}개
            {farmZones.length > 1 && (
              <span className="section-heading__n">
                {shown + 1} / {farmZones.length}
              </span>
            )}
          </h2>
          {farmZones.length > 1 && (
            <div className="zone-tabs" role="group" aria-label="고칠 구역">
              {farmZones.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  className={`chip${i === shown ? ' chip--on' : ''}`}
                  aria-pressed={i === shown}
                  onClick={() => goZone(i)}
                >
                  {z.name || `구역 ${i + 1}`}
                  <span className="chip__sub">{z.crop}</span>
                </button>
              ))}
            </div>
          )}
          <ul className="zone-edit-list" ref={listRef} onScroll={onZoneScroll}>
            {farmZones.map((z) => {
              const planted = !!z.plantedAt && z.plantedAt <= today
              return (
                <li key={z.id} className="zone-edit">
                  <label className="field">
                    <span className="field__label zone-edit__label">
                      구역 이름
                      <span>{num(toPyeong(z.areaM2))}평</span>
                    </span>
                    <input
                      className="input input--title"
                      value={z.name}
                      maxLength={10}
                      placeholder="예: 개울가"
                      onChange={(e) => updateZone(z.id, { name: e.target.value })}
                      onBlur={(e) => !e.target.value.trim() && updateZone(z.id, { name: '이름 없는 구역' })}
                    />
                  </label>

                  <CropField
                    value={z.crop}
                    onPick={(c) => setPending({ type: 'crop', zone: z, crop: c, count: countOf(z.id) })}
                  />

                  <div className="zone-edit__dates">
                    <label className="field">
                      <span className="field__label">심은 날</span>
                      <input
                        type="date"
                        className="input"
                        value={z.plantedAt ?? ''}
                        onChange={(e) => updateZone(z.id, { plantedAt: e.target.value || null })}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">수확 예정일</span>
                      <input
                        type="date"
                        className="input"
                        value={z.harvestAt ?? ''}
                        min={z.plantedAt ?? undefined}
                        onChange={(e) => updateZone(z.id, { harvestAt: e.target.value || null })}
                      />
                    </label>
                  </div>
                  <p className={`zone-edit__status${planted ? '' : ' is-pre'}`}>
                    <Icon name={planted ? 'plant' : 'shovel'} size={18} />
                    {planted
                      ? `심은 지 ${diffDays(today, z.plantedAt!)}일${z.harvestAt ? `, 수확까지 ${diffDays(z.harvestAt, today)}일` : ', 수확 예정일을 넣어 주세요'}`
                      : '아직 심기 전이에요'}
                  </p>
                  {farmZones.length > 1 && (
                    <button
                      type="button"
                      className="zone-edit__delete"
                      onClick={() => setPending({ type: 'delete', zone: z, count: countOf(z.id) })}
                    >
                      <Icon name="trash" size={18} />
                      구역 삭제
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="cta-bar">
        <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate('/map')}>
          저장하기
        </button>
      </div>

      <ConfirmDialog
        open={!!pending}
        danger
        title={
          pending?.type === 'delete'
            ? `‘${pending.zone.name}’ 구역을 삭제할까요?`
            : `작물을 ${pending ? ro(pending.crop) : ''} 바꿀까요?`
        }
        confirmLabel={pending?.type === 'delete' ? '삭제하기' : '바꾸기'}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <p>
            {pending.count > 0 ? (
              <>
                이 구역의 살포 기록 {pending.count}건도 함께 삭제돼요.
                <br />
                <strong>삭제한 기록은 복구할 수 없어요.</strong>
              </>
            ) : pending.type === 'delete' ? (
              <strong>삭제한 구역은 복구할 수 없어요.</strong>
            ) : (
              '바꾸면 판정을 처음부터 다시 해요.'
            )}
          </p>
        )}
      </ConfirmDialog>

      {finding && <FindFarmSheet onClose={() => setFinding(false)} />}
    </div>
  )
}

type Draft = { key: number; name: string; crop: Crop | null }

const PARCEL: [number, number][] = [[70, 190], [320, 172], [334, 380], [82, 398]]

/** 미리 보기용: 사각형을 구역 수만큼 세로로 나눈다 */
function draftZones(drafts: Draft[], areaM2: number): Zone[] {
  const [a, b, c, d] = PARCEL
  const at = (p: [number, number], q: [number, number], t: number): [number, number] => [
    Math.round(p[0] + (q[0] - p[0]) * t),
    Math.round(p[1] + (q[1] - p[1]) * t),
  ]
  return drafts.map((z, i) => {
    const t0 = i / drafts.length
    const t1 = (i + 1) / drafts.length
    return {
      id: `draft-${z.key}`,
      farmId: 'draft',
      name: z.name.trim() || `구역 ${i + 1}`,
      crop: z.crop ?? '배추',
      plantedAt: null,
      harvestAt: null,
      areaM2: Math.round(areaM2 / drafts.length),
      points: [at(a, b, t0), at(a, b, t1), at(d, c, t1), at(d, c, t0)],
    }
  })
}

const MAX_ZONES = 6

function FindFarmSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { addFarm, setCurrentFarm } = useApp()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<(typeof ADDRESS_BOOK)[number] | null>(null)
  const [name, setName] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([{ key: 1, name: '', crop: null }])
  const [newId, setNewId] = useState('')

  const query = q.trim()
  const results = query ? ADDRESS_BOOK.filter((a) => (a.address + a.hint).includes(query)) : ADDRESS_BOOK
  const region = picked?.address.split(' ').find((w) => /[면읍동]$/.test(w)) ?? ''
  const ready = drafts.every((z) => z.name.trim() && z.crop)

  const patch = (key: number, p: Partial<Draft>) =>
    setDrafts((list) => list.map((z) => (z.key === key ? { ...z, ...p } : z)))

  const titles = { 1: '내 밭 찾기', 2: '이 밭이 맞나요?', 3: '구역 나누기', 4: '밭을 등록했어요' }

  return (
    <Sheet
      open
      tall
      onClose={onClose}
      title={titles[step]}
      footer={
        step === 2 ? (
          <div className="sheet-actions sheet-actions--row">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
              다시 검색
            </button>
            <button type="button" className="btn btn--primary btn--lg" disabled={!name.trim()} onClick={() => setStep(3)}>
              이 밭 등록하기
            </button>
          </div>
        ) : step === 3 ? (
          <div className="sheet-actions sheet-actions--row">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(2)}>
              이전
            </button>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              disabled={!ready}
              onClick={() => {
                if (!picked) return
                setNewId(
                  addFarm({
                    name: name.trim(),
                    address: picked.address,
                    region,
                    areaM2: picked.areaM2,
                    zones: drafts.map((z) => ({ name: z.name.trim(), crop: z.crop! })),
                  }),
                )
                setStep(4)
              }}
            >
              등록하기
            </button>
          </div>
        ) : step === 4 ? (
          <div className="sheet-actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                setCurrentFarm(newId)
                navigate('/map')
              }}
            >
              확인
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setCurrentFarm(newId)
                onClose()
              }}
            >
              심은 날 입력하기
            </button>
          </div>
        ) : undefined
      }
    >
      <ol className="stepper stepper--4" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className={n <= step ? 'is-on' : ''} />
        ))}
      </ol>

      {step === 1 && (
        <div className="find-step">
          <label className="search">
            <Icon name="magnifying-glass" size={22} />
            <span className="sr-only">주소 검색</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="지번, 마을 이름 (예: 대기리)"
              data-autofocus
              enterKeyHint="search"
            />
          </label>
          <p className="find-step__label">{query ? `검색 결과 ${results.length}개` : '많이 찾는 곳'}</p>
          <ul className="addr-list">
            {results.map((a) => (
              <li key={a.address}>
                <button
                  type="button"
                  className="addr"
                  onClick={() => {
                    setPicked(a)
                    setName(a.hint.replace(/ .*/, '') + ' 밭')
                    setStep(2)
                  }}
                >
                  <Icon name="map-pin" size={22} />
                  <span className="addr__body">
                    <span className="addr__hint">{a.hint}</span>
                    <span className="addr__text">{a.address}</span>
                  </span>
                  <Icon name="caret-right" size={18} />
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="muted-box">검색 결과가 없어요. 번지를 빼고 검색해 보세요.</li>}
          </ul>
        </div>
      )}

      {step === 2 && picked && (
        <div className="find-step">
          <div className="locate">
            <FieldMap
              zones={draftZones([{ key: 0, name: '새 밭', crop: '배추' }], picked.areaM2)}
              selectedId="draft-0"
              ariaLabel="찾은 밭 위치"
              className="locate__map locate__map--plain"
            />
            <span className="locate__pin" aria-hidden="true">
              <Icon name="map-pin" weight="fill" size={36} />
            </span>
          </div>
          <p className="locate__addr">
            <strong>{picked.address}</strong>
            <span>지적도 면적 {num(picked.areaM2)}㎡, 약 {num(toPyeong(picked.areaM2))}평</span>
          </p>
          <label className="field">
            <span className="field__label">밭 이름</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 안반데기 밭" />
          </label>
        </div>
      )}

      {step === 3 && picked && (
        <div className="find-step">
          <div className="locate locate--zones">
            <FieldMap zones={draftZones(drafts, picked.areaM2)} ariaLabel="나눈 구역 미리 보기" className="locate__map" zoneLabel={(z) => z.crop} />
          </div>
          <p className="find-step__label">부르기 편한 이름과 심을 작물을 정해 주세요</p>
          <ul className="draft-list">
            {drafts.map((z, i) => (
              <li key={z.key} className="draft">
                <div className="draft__head">
                  <label className="field draft__name">
                    <span className="field__label">구역 {i + 1} 이름</span>
                    <input
                      className="input"
                      value={z.name}
                      maxLength={10}
                      placeholder={['예: 개울가', '예: 언덕 위', '예: 감자 큰밭'][i % 3]}
                      onChange={(e) => patch(z.key, { name: e.target.value })}
                    />
                  </label>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--filled draft__remove"
                      aria-label={`구역 ${i + 1} 삭제`}
                      onClick={() => setDrafts((list) => list.filter((x) => x.key !== z.key))}
                    >
                      <Icon name="x" size={20} />
                    </button>
                  )}
                </div>
                <CropField value={z.crop} onPick={(c) => patch(z.key, { crop: c })} />
              </li>
            ))}
          </ul>
          {drafts.length < MAX_ZONES && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() =>
                setDrafts((list) => [...list, { key: Date.now(), name: '', crop: null }])
              }
            >
              <Icon name="plus" size={20} />
              구역 추가
            </button>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="find-done">
          <span className="find-done__icon">
            <Icon name="check-circle" weight="fill" size={48} />
          </span>
          <p className="find-done__title">{name}</p>
          <p className="find-done__body">
            {drafts.map((z) => z.name.trim()).join(', ')} 구역을 만들었어요. 심은 날을 넣으면 바로 판정해 드려요.
          </p>
        </div>
      )}
    </Sheet>
  )
}
