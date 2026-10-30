import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { CompanyMark, ProductArt } from '../components/ProductArt'
import { Sheet } from '../components/Sheet'
import { SCAN_RESULT, drugById } from '../data/mock'
import { groupColor } from '../lib/verdict'
import { ro } from '../lib/korean'
import './ScanSheet.css'

type Phase = 'idle' | 'reading' | 'done'

export default function ScanSheet() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const albumInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    if (photo && photo !== 'sample') URL.revokeObjectURL(photo)
  }, [photo])

  useEffect(() => {
    if (phase !== 'reading') return
    const t = window.setTimeout(() => setPhase('done'), 1300)
    return () => window.clearTimeout(t)
  }, [phase])

  const start = (src: string) => {
    setPhoto(src)
    setPicked(null)
    setPhase('reading')
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) start(URL.createObjectURL(f))
    e.target.value = ''
  }

  const close = () => navigate('/map')
  const pickedDrug = picked ? drugById(picked) : undefined

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
          <button type="button" className="text-btn" onClick={() => start('sample')}>
            예시 사진으로 해 보기
            <Icon name="caret-right" size={16} />
          </button>
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
                  {SCAN_RESULT.lines.map((l) => (
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

          {phase === 'done' && (
            <fieldset className="scan-cands">
              <legend className="scan-cands__legend">
                어떤 약인가요?
                <span>하나를 고르면 판정해 드려요</span>
              </legend>
              {SCAN_RESULT.candidates.map((c) => {
                const d = drugById(c.drugId)!
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
                          계통 {d.group}번
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
