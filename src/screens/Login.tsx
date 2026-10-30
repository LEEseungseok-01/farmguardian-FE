import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FieldMap } from '../components/FieldMap'
import { CustomIcon, Icon } from '../components/Icon'
import { Wordmark } from '../components/Logo'
import { ProductArt } from '../components/ProductArt'
import { StatusBadge } from '../components/StatusBadge'
import { ZONES, drugById } from '../data/mock'
import './Login.css'

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1788122046327-a25a8664574c?auto=format&fit=crop&w=900&h=640&q=75'

const FEATURES: { title: string; body: string }[] = [
  {
    title: '봉지의 작은 글씨를 대신 읽어요',
    body: '수확 며칠 전까지 쓸 수 있는지, 몇 번까지 되는지 찾아 드려요.',
  },
  {
    title: '올해 몇 번 뿌렸는지 세어 둬요',
    body: '구역마다 횟수를 따로 봐요. 넘기기 전에 막아 드려요.',
  },
  {
    title: '같은 약만 쓰는 걸 알려 줘요',
    body: '이름이 달라도 계통이 같으면 같은 약이에요. 겹치면 미리 말해 드려요.',
  },
]

const STEPS: { name: string; ask: string }[] = [
  { name: '등록', ask: '이 작물에 쓸 수 있는 약인가' },
  { name: '시기', ask: '수확까지 며칠 남았나' },
  { name: '횟수', ask: '올해 더 뿌려도 되나' },
  { name: '계통', ask: '직전과 같은 약인가' },
]

export default function Login() {
  const navigate = useNavigate()
  const sample = drugById('d-benevia')!
  const [photoFailed, setPhotoFailed] = useState(false)
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
        <p className="login__lead">뿌려도 되는지 네 가지를 따져서 알려 드려요.</p>
        <ol className="login__steps" aria-label="확인하는 네 가지">
          {STEPS.map((s, i) => (
            <li key={s.name}>
              <span className="login__step-num">{i + 1}</span>
              <span className="login__step-name">{s.name}</span>
              <span className="login__step-ask">{s.ask}</span>
            </li>
          ))}
        </ol>

        <figure className="login__photo">
          {photoFailed ? (
            <FieldMap zones={ZONES.filter((z) => z.farmId === 'f1')} selectedId="z-a" ariaLabel="" className="login__map" />
          ) : (
            <img
              src={HERO_PHOTO}
              alt="하늘에서 내려다본 배추밭 이랑"
              width={900}
              height={640}
              onError={() => setPhotoFailed(true)}
            />
          )}
          <span className="login__photo-chip">
            <Icon name="map-pin" weight="fill" size={18} />
            대관령 윗밭 · 개울가
          </span>
          <figcaption className="login__preview">
            <span className="login__preview-cap">이 구역에 이 약을 쓰면</span>
            <span className="login__preview-row">
              <ProductArt drug={sample} size={36} />
              <span className="login__preview-text">
                <strong>{sample.name}</strong>
                <span>배추좀나방</span>
              </span>
              <StatusBadge status="ok" />
            </span>
            <span className="login__preview-checks">
              {STEPS.map((s) => (
                <span key={s.name}>
                  <Icon name="check" size={13} />
                  {s.name}
                </span>
              ))}
            </span>
          </figcaption>
        </figure>
      </section>

      <div className="login__actions">
        <button type="button" className="btn btn--kakao btn--lg" onClick={() => navigate('/map')}>
          <CustomIcon name="kakao" size={22} />
          카카오로 시작하기
        </button>
        <button type="button" className="btn btn--outline btn--lg" onClick={() => navigate('/map')}>
          먼저 둘러볼게요
          <Icon name="arrow-right" size={20} />
        </button>
        <p className="login__note">가입 없이 예시 밭으로 모든 기능을 써 볼 수 있어요</p>
      </div>

      <section className="login__features" aria-labelledby="features-title">
        <h2 id="features-title" className="section-heading">이 앱이 대신 해 주는 일</h2>
        <ul className="feature-list">
          {FEATURES.map((f) => (
            <li key={f.title} className="feature">
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__body">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

    </main>
  )
}
