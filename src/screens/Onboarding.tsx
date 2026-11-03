import { useState } from 'react'
import { Icon } from '../components/Icon'
import { zoneName } from '../data/mock'
import { useApp } from '../state/AppState'
import { AddRecordSheet } from './History'

/** 가입 뒤 첫 화면. 판정이 횟수·계통을 따지려면 지난 기록이 빠짐없어야 해서, 구역마다 확인을 받는다 */
export default function Onboarding() {
  const { zones, today, confirmHistory, completeOnboarding, signOut } = useApp()
  const [adding, setAdding] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ready = zones.every((z) => z.historyConfirmed)

  return (
    <div className="page page--cta">
      <div className="page__body find-step">
        <h1 className="section-heading">시작하기 전에</h1>
        <p className="find-step__label">
          올해 이 밭에 뿌린 약을 알아야 몇 번 썼는지, 같은 계통을 거듭 쓰는지 따질 수 있어요. 구역마다 지난 기록을
          넣고, 빠진 게 없으면 확인해 주세요.
        </p>

        <ul className="addr-list">
          {zones.map((z) => (
            <li key={z.id} className="draft">
              <p className="addr__hint">
                {zoneName(z)} · {z.crop}
              </p>
              <p className="addr__text">{z.plantedAt ? `${z.plantedAt}에 심음` : '심은 날 없음'}</p>
              <div className="sheet-actions sheet-actions--row">
                <button type="button" className="btn btn--soft" onClick={() => setAdding(z.id)}>
                  <Icon name="plus" size={20} />
                  지난 기록 추가
                </button>
                <button
                  type="button"
                  className={`btn ${z.historyConfirmed ? 'btn--ghost' : 'btn--outline'}`}
                  disabled={z.historyConfirmed}
                  onClick={() => confirmHistory(z.id)}
                >
                  {z.historyConfirmed ? '확인했어요' : '빠짐없이 넣었어요'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="cta-bar">
        <button
          type="button"
          className="btn btn--primary btn--lg"
          disabled={!ready || busy}
          onClick={async () => {
            setBusy(true)
            await completeOnboarding()
            setBusy(false)
          }}
        >
          시작하기
        </button>
        <button type="button" className="btn btn--ghost" onClick={signOut}>
          로그아웃
        </button>
      </div>

      {adding && <AddRecordSheet onClose={() => setAdding(null)} today={today} defaultZone={adding} />}
    </div>
  )
}
