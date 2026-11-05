import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { CompanyMark, ProductArt } from '../components/ProductArt'
import { Sheet } from '../components/Sheet'
import { SCAN_RESULT, drugById, type Drug } from '../data/mock'
import { api } from '../lib/api'
import { shrinkImage } from '../lib/shrinkImage'
import { toDrug, type ServerPesticide } from '../lib/serverVerdict'
import { useApp } from '../state/AppState'
import { groupColor, groupLabel } from '../lib/verdict'
import { ro } from '../lib/korean'
import './ScanSheet.css'

type Phase = 'idle' | 'reading' | 'done'

type Scan = { lines: string[]; cands: { drug: Drug; match: string }[] }
type OcrResult = {
  candidates: { pesticide: ServerPesticide; matched: string[] }[]
  read: { brand: string | null; product: string | null; company: string | null; text: string }
}

// 약이 없는 시연장에서도 실제 OCR을 해 볼 수 있는 봉지 사진
const SAMPLES = [
  { name: '베네비아', src: '/samples/benevia.png' },
  { name: '델리게이트', src: '/samples/delegate.png' },
  { name: '라이몬', src: '/samples/raimon.png' },
]
const CABBAGE_DIAMONDBACK_MOTH = '48' // 세 약이 모두 등록된 배추 병해충

const FIELD = { brand: '상표', product: '품목', company: '제조사' } as Record<string, string>

// 예시 사진은 서버에 보내지 않고 미리 만든 결과를 보여 준다
const SAMPLE: Scan = {
  lines: SCAN_RESULT.lines,
  cands: SCAN_RESULT.candidates.map((c) => ({ drug: drugById(c.drugId)!, match: c.match })),
}

function fromOcr(r: OcrResult): Scan {
  const lines = r.read.text.split('\n').filter(Boolean)
  return {
    lines: lines.length ? lines : [r.read.brand, r.read.product, r.read.company].filter((x): x is string => !!x),
    cands: r.candidates.map((c) => ({
      drug: toDrug(c.pesticide),
      match: c.matched.length ? `${c.matched.map((m) => FIELD[m] ?? m).join('·')}이 맞아요` : '',
    })),
  }
}

export default function ScanSheet() {
  const navigate = useNavigate()
  const { user, zone, selectPest } = useApp()
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const albumInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    if (photo && photo !== 'sample') URL.revokeObjectURL(photo)
  }, [photo])

  useEffect(() => {
    if (phase !== 'reading' || user) return
    const t = window.setTimeout(() => setPhase('done'), 1300)
    return () => window.clearTimeout(t)
  }, [phase, user])

  const start = (src: string) => {
    setPhoto(src)
    setPicked(null)
    setPhase('reading')
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      start(URL.createObjectURL(f))
      if (user) read(f)
    }
    e.target.value = ''
  }

  const read = async (file: File) => {
    setError('')
    setScan(null)
    const form = new FormData()
    form.append('image', await shrinkImage(file))
    try {
      setScan(fromOcr(await api<OcrResult>('/ocr/pesticide-labels', { method: 'POST', body: form })))
    } catch (e) {
      setError((e as Error).message)
    }
    setPhase('done')
  }

  const startSample = async (src: string) => {
    start(src)
    setError('')
    setScan(null)
    if (zone.crop === '배추') selectPest(CABBAGE_DIAMONDBACK_MOTH)
    try {
      const blob = await (await fetch(src)).blob()
      await read(new File([blob], 'sample.png', { type: blob.type }))
    } catch {
      setError('예시 사진을 불러오지 못했어요')
      setPhase('done')
    }
  }

  const shown = user ? scan : SAMPLE

  const close = () => navigate('/map')
  const pickedDrug = picked ? shown?.cands.find((c) => c.drug.id === picked)?.drug : undefined

  return (
    <Sheet
      open
      tall
      onClose={close}
      title="봉지 찍어서 찾기"
      sub="봉지 앞면을 찍으면 맞는 약을 찾아 드려요"
      footer={
        <div className="scan-foot">
          <button
            type="button"
            className="btn btn--primary btn--lg"
            disabled={!pickedDrug}
            onClick={() => pickedDrug && navigate(`/verdict/${pickedDrug.id}`)}
          >
            {pickedDrug ? (
              <>
                <Icon name="seal-check" size={22} weight="fill" />
                {ro(pickedDrug.name)} 판정하기
              </>
            ) : (
              <>
                <Icon name="lock-simple" size={22} />
                판정하기
              </>
            )}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/pests')}>
            <Icon name="magnifying-glass" size={20} />
            병해충으로 찾기
          </button>
        </div>
      }
    >
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={albumInput} type="file" accept="image/*" hidden onChange={onFile} />

      {phase === 'idle' ? (
        <div className="scan-drop">
          <span className="scan-drop__shot" aria-hidden="true">
            <SamplePouch />
          </span>
          <p className="scan-drop__title">이 면을 찍어 주세요</p>
          <p className="scan-drop__hint">약 이름이 크게 적힌 앞면이에요.</p>
          <div className="scan-drop__actions">
            <button type="button" className="btn btn--primary" onClick={() => cameraInput.current?.click()}>
              <Icon name="camera" size={22} weight="fill" />
              사진 찍기
            </button>
            <button type="button" className="btn btn--soft" onClick={() => albumInput.current?.click()}>
              <Icon name="images" size={22} />
              앨범에서 가져오기
            </button>
          </div>
          {user && (
            <div className="scan-samples">
              <p className="scan-samples__title">약이 없으면 예시 사진으로 해 보세요</p>
              <div className="scan-samples__list">
                {SAMPLES.map((s) => (
                  <button key={s.src} type="button" className="scan-sample" onClick={() => startSample(s.src)}>
                    <img src={s.src} alt="" />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!user && (
            <button type="button" className="text-btn" onClick={() => start('sample')}>
              예시 사진으로 해 보기
              <Icon name="caret-right" size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="scan-result">
          <div className="scan-shot">
            <div className="scan-shot__img">
              {photo === 'sample' ? <SamplePouch /> : <img src={photo!} alt="올린 봉지 사진" />}
              {phase === 'reading' && <span className="scan-shot__beam" aria-hidden="true" />}
            </div>
            <div className="scan-ocr">
              <p className="scan-ocr__label">
                <Icon name="text-aa" size={18} />
                포장지에서 읽은 글자
              </p>
              {phase === 'reading' ? (
                <p className="scan-ocr__loading" aria-live="polite">글자를 읽고 있어요</p>
              ) : (
                <ul className="scan-ocr__lines" aria-label="읽은 그대로">
                  {(shown?.lines ?? []).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              <button type="button" className="text-btn" onClick={() => setPhase('idle')}>
                <Icon name="arrow-counter-clockwise" size={16} />
                다시 찍기
              </button>
            </div>
          </div>

          {phase === 'done' && error && (
            <p className="signup-error" role="alert">
              {error}
            </p>
          )}
          {phase === 'done' && !error && shown?.cands.length === 0 && (
            <p className="muted-box">읽은 글자로 찾은 약이 없어요. 병해충으로 찾아 보세요.</p>
          )}
          {phase === 'done' && !!shown?.cands.length && (
            <fieldset className="scan-cands">
              <legend className="scan-cands__legend">
                어떤 약인가요?
                <span>하나를 고르면 판정해 드려요</span>
              </legend>
              {shown.cands.map((c) => {
                const d = c.drug
                const on = picked === d.id
                return (
                  <label key={d.id} className={`cand${on ? ' is-on' : ''}`}>
                    <input
                      type="radio"
                      name="scan-cand"
                      value={d.id}
                      checked={on}
                      onChange={() => setPicked(d.id)}
                      className="sr-only"
                    />
                    <ProductArt drug={d} size={40} />
                    <span className="cand__body">
                      <span className="cand__name">
                        {d.name} <span className="cand__form">{d.form}</span>
                      </span>
                      <span className="cand__meta">
                        {d.ingredient} {d.percent}
                      </span>
                      <span className="cand__meta cand__company">
                        <CompanyMark company={d.company} size={16} />
                        {d.company}
                        <span className="group-chip" style={{ ['--gc' as string]: groupColor(d.group) }}>
                          그룹 {groupLabel(d.group)}
                        </span>
                      </span>
                      <span className="cand__match">{c.match}</span>
                    </span>
                    <span className="cand__radio" aria-hidden="true">
                      {on && <Icon name="check" size={18} />}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}
        </div>
      )}

      <ul className={`scan-warn${phase === 'idle' ? ' is-hidden' : ''}`} aria-label="꼭 알아 두세요">
        <li>
          <Icon name="warning-circle" size={20} weight="fill" />
          읽은 글자는 그대로 쓰지 않아요. 고른 약으로만 판정해요.
        </li>
        <li>
          <Icon name="calendar-blank" size={20} weight="fill" />
          봉지에 적힌 날짜는 만든 날이지 뿌린 날이 아니에요.
        </li>
      </ul>
    </Sheet>
  )
}

/** 예시 봉지 그림 */
function SamplePouch() {
  return (
    <svg viewBox="0 0 160 200" className="sample-pouch" role="img" aria-label="델리게이트 입상수화제 봉지 그림">
      <path d="M18 22 26 12l8 10 8-10 8 10 8-10 8 10 8-10 8 10 8-10 8 10 8-10 8 10 8-10 8 10 4-6v170a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10Z" className="sp-body" />
      <rect x="18" y="38" width="124" height="44" className="sp-band" />
      <text x="80" y="58" textAnchor="middle" className="sp-title">델리게이트</text>
      <text x="80" y="75" textAnchor="middle" className="sp-sub">입상수화제</text>
      <text x="80" y="104" textAnchor="middle" className="sp-text">스피네토람 25%</text>
      <rect x="40" y="118" width="80" height="6" rx="3" className="sp-line" />
      <rect x="50" y="130" width="60" height="6" rx="3" className="sp-line" />
      <text x="80" y="164" textAnchor="middle" className="sp-text">(주)팜한농</text>
      <text x="80" y="184" textAnchor="middle" className="sp-small">제조일자 2026.03.11</text>
    </svg>
  )
}
