import { Link, useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { Icon } from '../components/Icon'
import { DATA_SOURCE } from '../data/mock'
import { useApp } from '../state/AppState'
import './Settings.css'

// 심사와 농가 모두 「이 앱이 어디까지 책임지나」를 묻는다. 말로 하지 말고 적어 둔다
const DOES = [
  '등록된 약인지 농약안전정보시스템에서 찾아요',
  '수확 전 일수를 수확 가능한 날짜로 바꿔 줘요',
  '이번 농사에 몇 번 썼는지 세요',
  '같은 그룹을 연달아 썼는지 세요',
]

const DOES_NOT = [
  '사진으로 병해충을 진단하지 않아요. 사용자가 골라요',
  '저항성을 예측하지 않아요. 쓴 횟수를 셀 뿐이에요',
  '약효를 보증하지 않아요',
]

const SOURCES = [
  { name: DATA_SOURCE.name, use: `등록 정보와 안전사용기준 (${DATA_SOURCE.asOf} 기준)` },
  { name: '국가농작물병해충관리시스템', use: '병해충 도감과 사진' },
  { name: '농림축산식품 공공데이터 팜맵', use: '밭 경계' },
  { name: '기상청 단기예보', use: '오늘 날씨' },
]

const KEEPS = [
  { name: '카카오 계정 식별자', why: '같은 사람인지 알아보려고요' },
  { name: '밭 위치와 구역', why: '어느 밭 이야기인지 가리려고요' },
  { name: '살포 기록', why: '횟수와 그룹을 세려고요' },
]

export default function Settings() {
  const { signedIn, signOut, farms, zones, showToast } = useApp()
  const navigate = useNavigate()

  return (
    <div className="page page--nav">
      <AppBar title="설정" />

      <div className="page__body set-page">
        <section aria-labelledby="acct-title">
          <h2 id="acct-title" className="section-heading section-heading--sm">계정</h2>
          <div className="set-card">
            <p className="set-card__state">
              <Icon name={signedIn ? 'check-circle' : 'info'} weight={signedIn ? 'fill' : 'regular'} size={22} />
              {signedIn ? '카카오로 로그인했어요' : '로그인하지 않고 둘러보는 중이에요'}
            </p>
            <p className="set-card__hint">
              {signedIn
                ? '밭과 기록이 이 계정에 쌓여요'
                : '로그인하면 밭과 기록이 다른 기기에서도 보여요'}
            </p>
            {signedIn ? (
              <button
                type="button"
                className="btn btn--soft"
                onClick={() => {
                  signOut()
                  showToast({ text: '로그아웃했어요' })
                }}
              >
                <Icon name="sign-out" size={20} />
                로그아웃
              </button>
            ) : (
              <button type="button" className="btn btn--kakao" onClick={() => navigate('/')}>
                카카오로 로그인
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="farm-title">
          <h2 id="farm-title" className="section-heading section-heading--sm">내 밭</h2>
          <Link to="/fields" className="set-row">
            <Icon name="polygon" size={22} />
            <span className="set-row__body">
              <span className="set-row__name">밭과 구역 관리</span>
              <span className="set-row__meta">밭 {farms.length}곳, 구역 {zones.length}개</span>
            </span>
            <Icon name="caret-right" size={18} />
          </Link>
        </section>

        <section aria-labelledby="about-title">
          <h2 id="about-title" className="section-heading section-heading--sm">앱 정보</h2>

          <details className="set-fold">
            <summary>
              <Icon name="seal-check" size={22} />
              하는 일과 안 하는 일
              <Icon name="caret-down" size={18} className="set-fold__caret" />
            </summary>
            <p className="set-fold__head">하는 일</p>
            <ul className="set-fold__list">
              {DOES.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="set-fold__head set-fold__head--off">안 하는 일</p>
            <ul className="set-fold__list set-fold__list--off">
              {DOES_NOT.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </details>

          <details className="set-fold">
            <summary>
              <Icon name="clipboard-text" size={22} />
              데이터 출처
              <Icon name="caret-down" size={18} className="set-fold__caret" />
            </summary>
            <ul className="set-fold__list set-fold__list--plain">
              {SOURCES.map((s) => (
                <li key={s.name}>
                  <b>{s.name}</b>
                  <span>{s.use}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="set-fold">
            <summary>
              <Icon name="lock-simple" size={22} />
              다루는 정보
              <Icon name="caret-down" size={18} className="set-fold__caret" />
            </summary>
            <ul className="set-fold__list set-fold__list--plain">
              {KEEPS.map((k) => (
                <li key={k.name}>
                  <b>{k.name}</b>
                  <span>{k.why}</span>
                </li>
              ))}
            </ul>
            <p className="set-fold__note">
              기록은 농약관리법에 따른 증빙으로도 쓰여요. 취소한 기록도 지우지 않고 취소 표시만 남겨요.
            </p>
          </details>
        </section>

        <p className="set-ver">팜가디언 1.0.0</p>
      </div>

      <BottomNav />
    </div>
  )
}
