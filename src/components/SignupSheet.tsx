import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Zone } from '../data/mock'
import { api } from '../lib/api'
import { num } from '../lib/date'
import { useApp } from '../state/AppState'
import { FieldMap } from './FieldMap'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import './SignupSheet.css'

type Address = { jibun_addr: string; pnu: string }
type Parcel = {
  farmmap_id: string
  lnm: string
  land_use: string
  area_m2: number
  matches_query: boolean
  geometry: { coordinates: [number, number][][][] }
}

// 지도 그림은 구역(Zone) 모양을 받는다. SVG는 y가 아래로 늘어나서 북쪽이 위로 가게 뒤집고,
// 여러 덩어리인 필지는 첫 덩어리의 바깥 테두리만 그린다
const toZone = (p: Parcel): Zone => ({
  id: p.farmmap_id,
  farmId: 'signup',
  name: p.lnm,
  crop: '배추',
  plantedAt: null,
  harvestAt: null,
  areaM2: p.area_m2,
  points: p.geometry.coordinates[0][0].map(([x, y]) => [x, -y]),
})

// 아래 규칙은 BE(identity·farm 스키마)와 같다. 서버가 거르기 전에 알려 주려는 것
const USERNAME = /^[A-Za-z0-9_]{3,30}$/
const KEYWORD = /^(?=.*[가-힣])[가-힣0-9 -]{2,80}$/
const MAX_PARCELS = 20

const TITLES = { 1: '회원가입', 2: '내 밭 찾기', 3: '필지 고르기' }

/** 아이디·비밀번호 → 주소로 밭 찾기 → 팜맵 필지 고르기. 마지막에 BE 가입을 부른다 */
export function SignupSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { signIn } = useApp()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [q, setQ] = useState('')
  const [found, setFound] = useState<{ total: number; items: Address[] } | null>(null)
  const [addr, setAddr] = useState<Address | null>(null)
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = (to: 1 | 2 | 3) => {
    setError('')
    setStep(to)
  }

  const run = async (job: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await job()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const search = () => {
    const keyword = q.trim()
    if (!KEYWORD.test(keyword)) {
      setError('마을 이름(한글)과 번지를 넣어 주세요. 예: 대기리 123')
      return
    }
    run(async () => setFound(await api(`/addresses/search?keyword=${encodeURIComponent(keyword)}`)))
  }

  const pick = (a: Address) =>
    run(async () => {
      const list = await api<Parcel[]>(`/parcels?pnu=${a.pnu}`)
      if (list.length === 0) throw new Error('이 주소에는 팜맵 필지가 없어요. 다른 주소로 찾아 주세요')
      setAddr(a)
      setParcels(list)
      setPicked(list.filter((p) => p.matches_query).map((p) => p.farmmap_id))
      setStep(3)
    })

  const toggle = (id: string) =>
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_PARCELS ? [...list, id] : list,
    )

  const signup = () =>
    run(async () => {
      const me = await api<{ id: number; username: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          field_name: name.trim(),
          parcel_farmmap_ids: picked,
          field_address: addr?.jibun_addr,
        }),
      })
      signIn({ id: me.id, username: me.username })
      navigate('/map')
    })

  return (
    <Sheet
      open
      tall
      onClose={onClose}
      title={TITLES[step]}
      footer={
        step === 1 ? (
          <div className="sheet-actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              disabled={!USERNAME.test(username) || password.length < 4 || password.length > 72}
              onClick={() => go(2)}
            >
              다음
            </button>
          </div>
        ) : step === 2 ? (
          <div className="sheet-actions sheet-actions--row">
            <button type="button" className="btn btn--ghost" onClick={() => go(1)}>
              이전
            </button>
          </div>
        ) : (
          <div className="sheet-actions sheet-actions--row">
            <button type="button" className="btn btn--ghost" onClick={() => go(2)}>
              이전
            </button>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              disabled={busy || !name.trim() || picked.length === 0}
              onClick={signup}
            >
              {busy ? '가입하는 중…' : '가입하기'}
            </button>
          </div>
        )
      }
    >
      <ol className="stepper" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <li key={n} className={n <= step ? 'is-on' : ''} />
        ))}
      </ol>

      <div className="find-step">
        {step === 1 && (
          <>
            <label className="field">
              <span className="field__label">아이디</span>
              <input
                className="input"
                value={username}
                maxLength={30}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                data-autofocus
                onChange={(e) => setUsername(e.target.value)}
              />
              <span className="field__hint">영문, 숫자, 밑줄(_) 3~30자</span>
            </label>
            <label className="field">
              <span className="field__label">비밀번호</span>
              <input
                className="input"
                type="password"
                value={password}
                maxLength={72}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="field__hint">4자 이상</span>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <form
              className="search"
              onSubmit={(e) => {
                e.preventDefault()
                search()
              }}
            >
              <Icon name="magnifying-glass" size={22} />
              <span className="sr-only">주소 검색</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="마을 이름과 번지 (예: 대기리 123)"
                data-autofocus
                enterKeyHint="search"
              />
            </form>
            {found && (
              <>
                <p className="find-step__label">
                  검색 결과 {num(found.total)}개{found.total > found.items.length && ', 더 자세히 검색해 보세요'}
                </p>
                <ul className="addr-list">
                  {found.items.map((a) => (
                    <li key={a.pnu}>
                      <button type="button" className="addr" disabled={busy} onClick={() => pick(a)}>
                        <Icon name="map-pin" size={22} />
                        <span className="addr__body">
                          <span className="addr__hint">{a.jibun_addr}</span>
                        </span>
                        <Icon name="caret-right" size={18} />
                      </button>
                    </li>
                  ))}
                  {found.items.length === 0 && (
                    <li className="muted-box">검색 결과가 없어요. 번지를 빼고 검색해 보세요.</li>
                  )}
                </ul>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <p className="find-step__label">{addr?.jibun_addr} 근처 필지예요. 내 밭에 넣을 필지를 골라 주세요</p>
            <div className="locate">
              <FieldMap
                zones={parcels.map(toZone)}
                selectedIds={picked}
                onSelect={toggle}
                ariaLabel="필지 지도. 눌러서 고르거나 뺄 수 있어요"
                className="locate__map locate__map--plain"
              />
            </div>
            <ul className="addr-list">
              {parcels.map((p) => {
                const on = picked.includes(p.farmmap_id)
                return (
                  <li key={p.farmmap_id}>
                    <label className="addr">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!on && picked.length >= MAX_PARCELS}
                        onChange={() => toggle(p.farmmap_id)}
                      />
                      <span className="addr__body">
                        <span className="addr__hint">{p.lnm}</span>
                        <span className="addr__text">
                          {p.land_use} · {num(Math.round(p.area_m2))}㎡
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <label className="field">
              <span className="field__label">밭 이름</span>
              <input
                className="input"
                value={name}
                maxLength={30}
                placeholder="예: 안반데기 밭"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </>
        )}

        {error && (
          <p className="signup-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
