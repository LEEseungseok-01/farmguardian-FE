import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { DrugCard, GroupChip, ReasonTag } from '../components/DrugCard'
import { Icon } from '../components/Icon'
import { CompanyMark, ProductArt } from '../components/ProductArt'
import { StatusBadge } from '../components/StatusBadge'
import { DATA_SOURCE, drugById, zoneName } from '../data/mock'
import { fmtFull } from '../lib/date'
import { eul } from '../lib/korean'
import { STATUS_META, alternatives, evaluate, type Check } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './Verdict.css'

export default function Verdict() {
  const { drugId = '' } = useParams()
  const navigate = useNavigate()
  const { zone, pestOf, records, today, addRecord, showToast, inventory, toggleInventory } = useApp()
  const drug = drugById(drugId)
  const pest = pestOf(zone)

  if (!drug || !pest) {
    return (
      <div className="page">
        <AppBar title="판정" fallback="/drugs" />
        <div className="page__body">
          <div className="empty">
            <Icon name="question" size={32} />
            <p>{drug ? `아직 ${zone.crop} 병해충 자료가 없어요` : '약을 찾을 수 없어요'}</p>
            <Link to="/drugs" className="btn btn--soft">약 목록 보기</Link>
          </div>
        </div>
      </div>
    )
  }

  const v = evaluate(drug, zone, pest, records, today)
  const meta = STATUS_META[v.status]
  const inStock = inventory.includes(v.drug.id)
  const alts = v.status === 'no' || v.status === 'unknown' ? alternatives(v, zone, pest, records, today) : []
  const doneToday = records.some((r) => !r.cancelled && r.date === today && r.zoneId === zone.id && r.drugId === drug.id)
  const blocked = v.status === 'no' || v.status === 'preplant'

  const record = () => {
    addRecord({ date: today, zoneId: zone.id, drugId: drug.id, pestId: pest.id })
    showToast({ text: `${eul(drug.name)} 기록했어요`, actionLabel: '보기', actionTo: '/history' })
  }

  return (
    <div className="page page--cta">
      <AppBar title={drug.name} sub={`${zoneName(zone)} ${zone.crop}에 ${pest.name}`} fallback="/drugs" />

      <div className="page__body verdict-page">
        <section className={`verdict-hero verdict-hero--${v.status}`} aria-labelledby="verdict-headline">
          <div className="verdict-hero__top">
            <span className="verdict-hero__icon">
              <Icon name={meta.icon} weight="fill" size={34} />
            </span>
            <StatusBadge status={v.status} size="lg" />
          </div>
          <h2 id="verdict-headline" className="verdict-hero__headline">{meta.headline}</h2>
          {v.status !== 'ok' && (
            <p className="verdict-hero__reason">
              {v.reasonTag && <ReasonTag>{v.reasonTag}</ReasonTag>}
              {v.reason}
            </p>
          )}
          {v.status === 'preplant' && (
            <Link to="/fields" className="verdict-hero__link">
              심은 날 입력하기
              <Icon name="caret-right" size={16} />
            </Link>
          )}
        </section>

        <section aria-labelledby="checks-title">
          <h2 id="checks-title" className="section-heading section-heading--sm">네 가지 확인</h2>
          <ol className="checks">
            {v.checks.map((c) => (
              <CheckCell key={c.key} c={c} />
            ))}
          </ol>
        </section>

        <section aria-labelledby="facts-title">
          <h2 id="facts-title" className="section-heading section-heading--sm">판정 근거</h2>
          <dl className="facts">
            {v.facts.map((f) => (
              <div key={f.label} className="facts__row">
                <dt>{f.label}</dt>
                <dd>
                  <strong>{f.value}</strong>
                  {f.sub && <span className="facts__sub">{f.sub}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            className={`stock-btn${inStock ? ' is-on' : ''}`}
            aria-pressed={inStock}
            onClick={() => {
              toggleInventory(v.drug.id)
              showToast({ text: inStock ? `${v.drug.name} 창고에서 뺐어요` : `${v.drug.name} 창고에 넣었어요` })
            }}
          >
            <Icon name="package" size={20} weight={inStock ? 'fill' : 'regular'} />
            {inStock ? '창고에 있음' : '창고에 넣기'}
          </button>
          <p className="source">
            <Icon name="info" size={18} />
            자료 출처: {DATA_SOURCE.name}, {fmtFull(DATA_SOURCE.asOf)} 기준
          </p>
        </section>

        {(v.status === 'no' || v.status === 'unknown') && (
          <section aria-labelledby="alts-title" className="alts">
            <h2 id="alts-title" className="section-heading section-heading--sm">대신 쓸 수 있는 약</h2>
            {alts.length ? (
              <ul className="drug-group__list">
                {alts.map((a) => (
                  <li key={a.drug.id}>
                    <DrugCard v={a} inStock={inventory.includes(a.drug.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-box">지금 쓸 수 있는 다른 약이 없어요. 가까운 농업기술센터에 물어보세요.</p>
            )}
          </section>
        )}

        <section aria-labelledby="drug-title">
          <h2 id="drug-title" className="section-heading section-heading--sm">약 정보</h2>
          <div className="drug-info">
            <ProductArt drug={drug} size={56} />
            <dl className="drug-info__list">
              <div><dt>이름</dt><dd>{drug.name} {drug.form}</dd></div>
              <div><dt>성분</dt><dd>{drug.ingredient} {drug.percent}</dd></div>
              <div>
                <dt>회사</dt>
                <dd className="drug-info__company">
                  <CompanyMark company={drug.company} size={18} />
                  {drug.company}
                </dd>
              </div>
              <div><dt>종류</dt><dd>{drug.kind} <GroupChip group={drug.group} /></dd></div>
            </dl>
          </div>
        </section>
      </div>

      <div className="cta-bar">
        {blocked && (
          <p className="cta-bar__note">
            <Icon name="lock-simple" size={18} />
            {v.status === 'no' ? '쓰면 안 되는 약은 기록할 수 없어요' : '심은 뒤에 기록할 수 있어요'}
          </p>
        )}
        <button
          type="button"
          className="btn btn--primary btn--lg"
          disabled={blocked || doneToday}
          onClick={record}
        >
          <Icon name={doneToday ? 'check-circle' : 'note-pencil'} size={22} weight="fill" />
          {doneToday ? '오늘 기록했어요' : '오늘 뿌린 것으로 기록하기'}
        </button>
        {doneToday && (
          <button type="button" className="text-btn cta-bar__link" onClick={() => navigate('/history')}>
            기록 보기
            <Icon name="caret-right" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function CheckCell({ c }: { c: Check }) {
  const skip = c.status === 'skip'
  const m = skip ? null : STATUS_META[c.status as keyof typeof STATUS_META]
  return (
    <li className={`check check--${c.status}`}>
      <span className="check__head">
        <Icon name={m ? m.icon : 'minus'} weight="fill" size={22} />
        <span className="check__label">{c.label}</span>
        <span className="check__state">{m ? m.check : '해당 없음'}</span>
      </span>
      <span className="check__text">
        {c.tag && <ReasonTag>{c.tag}</ReasonTag>}
        {c.text}
      </span>
    </li>
  )
}
