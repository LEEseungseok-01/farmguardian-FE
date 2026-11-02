import { useState } from 'react'
import { FeatureArt, type FeatureKind } from '../components/FeatureArt'
import { FieldMap } from '../components/FieldMap'
import { Icon } from '../components/Icon'
import { LoginSheet } from '../components/LoginSheet'
import type { IconName } from '../components/iconPaths'
import { Wordmark } from '../components/Logo'
import { ProductArt } from '../components/ProductArt'
import { Sheet } from '../components/Sheet'
import { SignupSheet } from '../components/SignupSheet'
import { StatusBadge } from '../components/StatusBadge'
import { ZONES, drugById } from '../data/mock'
import type { CheckStatus, Status } from '../lib/verdict'
import './Login.css'

const FEATURES: { kind: FeatureKind; title: string; body: string; wide?: boolean }[] = [
  {
    kind: 'scan',
    title: '봉지를 찍으면\n약을 찾아요',
    body: '작은 글씨를 대신 읽어요',
    wide: true,
  },
  { kind: 'harvest', title: '수확할 날을\n세어 줘요', body: '며칠 뒤에 딸 수 있는지' },
  { kind: 'count', title: '몇 번 뿌렸는지\n기억해요', body: '구역마다 따로 쌓여요' },
  {
    kind: 'rotate',
    title: '같은 약을 거듭 쓰면\n먼저 알려 줘요',
    body: '이름이 달라도 계통이 같으면 같은 약이에요',
    wide: true,
  },
]

const STEPS: { name: string; ask: string }[] = [
  { name: '등록', ask: '내 작물에 쓸 수 있는가?' },
  { name: '시기', ask: '수확 가능 날짜는?' },
  { name: '횟수', ask: '얼마나 더 써도 되나?' },
  { name: '계통', ask: '저번에 썼던 약과 같이 써도 되는지?' },
]

// 랜딩 지도에서는 구역 이름을 A·B·C·D로 바꿔 보여준다. 처음 온 사람에게 남의 밭 이름은 읽히지 않는다.
const DEMO_ZONES = ZONES.filter((z) => z.farmId === 'f1').map((z, i) => ({ ...z, name: 'ABCD'[i] }))

type ZoneDemo = { drugId: string; pest: string; status: Status; checks: CheckStatus[] }

const ZONE_DEMO: Record<string, ZoneDemo> = {
  'z-a': { drugId: 'd-benevia', pest: '배추좀나방', status: 'ok', checks: ['ok', 'ok', 'ok', 'ok'] },
  'z-b': { drugId: 'd-delegate', pest: '배추좀나방', status: 'caution', checks: ['ok', 'caution', 'ok', 'ok'] },
  'z-c': { drugId: 'd-delegate', pest: '진딧물', status: 'no', checks: ['no', 'skip', 'skip', 'skip'] },
  'z-d': { drugId: 'd-benevia', pest: '배추좀나방', status: 'preplant', checks: ['ok', 'preplant', 'preplant', 'ok'] },
}

const CHECK_ICON: Record<CheckStatus, IconName> = {
  ok: 'check',
  caution: 'warning',
  no: 'x',
  unknown: 'question',
  preplant: 'plant',
  skip: 'minus',
}

// 146,507건은 농촌진흥청 PSIS 농약검색 총 건수(2026-10-31 조회).
// 0.01ppm은 PLS 일률기준. 59.2%는 KREI R867 원문 수치 그대로.
const FACTS: { label: string; value: string; note: string }[] = [
  { label: '지켜야 할 안전사용기준', value: '146,507건', note: '약마다 작물마다 다 달라요' },
  { label: '내 작물에 사용하면 안 되는 약', value: '0.01ppm', note: '이만큼만 나와도 못 팔아요' },
  { label: '기준이 있다는 걸 아는 농업인', value: '59.2%', note: '열에 넷은 몰라요' },
]

const VERDICTS: { status: Status; text: string }[] = [
  { status: 'ok', text: '오늘 뿌려도 돼요' },
  { status: 'caution', text: '조건을 지키면 돼요' },
  { status: 'no', text: '쓰면 안 돼요' },
  { status: 'unknown', text: '자료가 없어요' },
  { status: 'preplant', text: '심은 다음에 알 수 있어요' },
]

const FLOW: { title: string; body: string }[] = [
  { title: '봉지를 찍어요', body: '약 이름과 성분을 읽어 와요' },
  { title: '구역을 골라요', body: '심은 날과 뿌린 기록을 가져와요' },
  { title: '답을 받아요', body: '네 가지를 따져 한 줄로 답해요' },
]

export default function Login() {
  const [signingUp, setSigningUp] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [guide, setGuide] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [last, setLast] = useState('z-a')
  const [touched, setTouched] = useState(false)

  const hover = (id: string | null) => {
    setActive(id)
    if (id) {
      setLast(id)
      setTouched(true)
    }
  }

  const demo = ZONE_DEMO[last]
  const drug = drugById(demo.drugId)!
  const zoneName = DEMO_ZONES.find((z) => z.id === last)!.name

  return (
    <main className="login page">
      <header className="login__brand">
        <Wordmark />
      </header>

      <section className="login__hero" aria-labelledby="login-title">
        <h1 id="login-title" className="login__title">
          농약 살포,
          <br />
          <em>안전하게</em> 결정하세요.
        </h1>

        <figure className="login__photo">
          <FieldMap
            zones={DEMO_ZONES}
            selectedId={active ?? undefined}
            onSelect={(id) => hover(id)}
            onHover={hover}
            zoneLabel={(z) => z.crop}
            ariaLabel="구역이 나뉜 밭 지도"
            className="login__map"
          />
          <span className="login__photo-chip">
            <Icon name="map-pin" weight="fill" size={18} />내 밭
          </span>
          <span className={`login__hint${touched ? ' is-gone' : ''}`} aria-hidden="true">
            <b>밭을 눌러보세요!</b>
          </span>
          <figcaption className={`login__preview${active ? ' is-on' : ''}`}>
            <span className="login__preview-cap">
              {zoneName} 구역에 {drug.name}, 써도 될까?
            </span>
            <span className="login__preview-row">
              <ProductArt drug={drug} size={32} />
              <span className="login__preview-text">
                <strong>{drug.name}</strong>
                <span>{demo.pest}</span>
              </span>
              <StatusBadge status={demo.status} />
            </span>
            <span className="login__preview-checks">
              {STEPS.map((s, i) => (
                <span key={s.name} className={`chk chk--${demo.checks[i]}`}>
                  <Icon name={CHECK_ICON[demo.checks[i]]} size={13} />
                  {s.name}
                </span>
              ))}
            </span>
          </figcaption>
        </figure>
      </section>

      <div className="login__actions">
        <button type="button" className="btn btn--ghost login__signup" onClick={() => setSigningUp(true)}>
          계정이 없어요
        </button>
        <button type="button" className="btn btn--primary btn--lg" onClick={() => setLoggingIn(true)}>
          로그인
        </button>
        <button type="button" className="btn btn--outline btn--lg" onClick={() => setGuide(true)}>
          어떻게 쓰는 건가요?
          <Icon name="arrow-right" size={20} />
        </button>
      </div>

      {guide && <GuideSheet onClose={() => setGuide(false)} />}

      {loggingIn && <LoginSheet onClose={() => setLoggingIn(false)} />}

      {signingUp && <SignupSheet onClose={() => setSigningUp(false)} />}
    </main>
  )
}

const GUIDE: { title: string; body: () => React.ReactNode }[] = [
  {
    title: '왜 만들었나',
    body: () => (
      <>
        <ul className="why">
          {FACTS.map((f) => (
            <li key={f.label}>
              <span className="why__l">{f.label}</span>
              <span className="why__v">{f.value}</span>
              <span className="why__n">{f.note}</span>
            </li>
          ))}
        </ul>
        <p className="why__src">
          <span>농촌진흥청 PSIS(2026.10)</span>
          <span>한국농촌경제연구원 R867(2019)</span>
        </p>
      </>
    ),
  },
  {
    title: '대신 해 주는 일',
    body: () => (
      <ul className="bento">
        {FEATURES.map((f) => (
          <li key={f.kind} className={`bento__card${f.wide ? ' bento__card--wide' : ''}`}>
            <div className="bento__text">
              <h3 className="bento__title">{f.title}</h3>
              <p className="bento__body">{f.body}</p>
            </div>
            <FeatureArt kind={f.kind} size={f.wide ? 76 : 64} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: '판정 다섯 가지',
    body: () => (
      <ul className="vlist">
        {VERDICTS.map((v) => (
          <li key={v.status}>
            <StatusBadge status={v.status} />
            <span>{v.text}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: '쓰는 순서',
    body: () => (
      <ol className="flow">
        {FLOW.map((f, i) => (
          <li key={f.title}>
            <span className="flow__n">{i + 1}</span>
            <span className="flow__t">{f.title}</span>
            <span className="flow__b">{f.body}</span>
          </li>
        ))}
      </ol>
    ),
  },
]

/** 처음 온 사람에게 한 장씩 보여 주는 사용 안내 */
function GuideSheet({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0)
  const last = page === GUIDE.length - 1
  return (
    <Sheet
      open
      tall
      onClose={onClose}
      title={GUIDE[page].title}
      footer={
        <div className="sheet-actions sheet-actions--row">
          {page > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => setPage(page - 1)}>
              이전
            </button>
          )}
          <button type="button" className="btn btn--primary btn--lg" onClick={last ? onClose : () => setPage(page + 1)}>
            {last ? '알겠어요' : '다음'}
          </button>
        </div>
      }
    >
      <ol className="stepper stepper--4" aria-hidden="true">
        {GUIDE.map((g, i) => (
          <li key={g.title} className={i <= page ? 'is-on' : ''} />
        ))}
      </ol>
      {GUIDE[page].body()}
    </Sheet>
  )
}
