import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../components/Icon'
import { DATA_SOURCE } from '../data/mock'
import { useApp } from '../state/AppState'
import './Settings.css'

// 심사와 농가 모두 「이 앱이 어디까지 책임지나」를 묻는다. 말로 하지 말고 적어 둔다
const DOES = [
  { name: '등록 조회', how: '작물과 병해충에 등록된 약인지 확인' },
  { name: '수확 가능일 환산', how: '수확 전 일수를 달력 날짜로 변환' },
  { name: '사용 횟수 집계', how: '이번 작기 살포 기록 합산' },
  { name: '작용기작 반복 점검', how: '직전 살포와 같은 그룹인지 대조' },
]

const DOES_NOT = [
  { name: '병해충 진단', how: '사진 판독 없음. 사용자가 직접 선택' },
  { name: '저항성 예측', how: '확률 모델 없음. 살포 횟수만 집계' },
  { name: '약효 보증', how: '방제 효과와 수확물 안전성을 보장하지 않음' },
]

const SOURCES = [
  { name: DATA_SOURCE.name, how: `등록 정보와 안전사용기준 (${DATA_SOURCE.asOf} 기준)` },
  { name: '국가농작물병해충관리시스템', how: '병해충 도감과 사진' },
  { name: '농림축산식품 공공데이터 팜맵', how: '밭 경계' },
  { name: '기상청 단기예보', how: '오늘 날씨' },
]

const PRIVACY = [
  { name: '아이디와 비밀번호', how: '회원 식별과 로그인 유지' },
  { name: '밭 위치와 구역 정보', how: '구역별 판정과 이력 관리' },
  { name: '살포 이력', how: '사용 횟수와 작용기작 반복 집계' },
]

export default function Settings() {
  const { user, signedIn, signOut, withdraw, farms, zones, showToast } = useApp()
  const [leaving, setLeaving] = useState(false)
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
              {user ? `${user.username} 계정으로 로그인했어요` : '로그인하지 않고 둘러보는 중이에요'}
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
              <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
                회원가입
              </button>
            )}
          </div>
        </section>

        {signedIn && (
          <button type="button" className="btn btn--ghost" onClick={() => setLeaving(true)}>
            회원 탈퇴
          </button>
        )}

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
              {DOES.map((d) => (
                <li key={d.name}>
                  <b>{d.name}</b>
                  <span>{d.how}</span>
                </li>
              ))}
            </ul>
            <p className="set-fold__head set-fold__head--off">안 하는 일</p>
            <ul className="set-fold__list">
              {DOES_NOT.map((d) => (
                <li key={d.name}>
                  <b>{d.name}</b>
                  <span>{d.how}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="set-fold">
            <summary>
              <Icon name="clipboard-text" size={22} />
              데이터 출처
              <Icon name="caret-down" size={18} className="set-fold__caret" />
            </summary>
            <ul className="set-fold__list">
              {SOURCES.map((d) => (
                <li key={d.name}>
                  <b>{d.name}</b>
                  <span>{d.how}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="set-fold">
            <summary>
              <Icon name="lock-simple" size={22} />
              개인정보 수집 항목
              <Icon name="caret-down" size={18} className="set-fold__caret" />
            </summary>
            <ul className="set-fold__list">
              {PRIVACY.map((d) => (
                <li key={d.name}>
                  <b>{d.name}</b>
                  <span>{d.how}</span>
                </li>
              ))}
            </ul>
            <p className="set-fold__note">
              살포 이력은 농약관리법상 증빙 자료로 보관하며, 취소한 기록도 삭제 없이 취소 상태로 보존합니다.
            </p>
          </details>
        </section>

        <p className="set-ver">팜가디언 1.0.0</p>
      </div>

      <ConfirmDialog
        open={leaving}
        danger
        title="회원 탈퇴할까요?"
        confirmLabel="탈퇴하기"
        onConfirm={async () => {
          setLeaving(false)
          if (await withdraw()) showToast({ text: '탈퇴했어요' })
        }}
        onCancel={() => setLeaving(false)}
      >
        <p>
          밭과 구역, 살포 기록이 모두 지워져요.
          <br />
          <strong>삭제한 정보는 복구할 수 없어요.</strong>
        </p>
      </ConfirmDialog>

      <BottomNav />
    </div>
  )
}
