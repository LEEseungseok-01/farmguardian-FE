import { Link } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { DrugCard } from '../components/DrugCard'
import { Icon } from '../components/Icon'
import { PestPhoto } from '../components/PestBits'
import { zoneName } from '../data/mock'
import { LIST_ORDER, STATUS_META, evaluate, registeredDrugs, sortVerdicts } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './DrugList.css'

export default function DrugList() {
  const { zone, farmZones, selectZone, pestOf, records, today, inventory } = useApp()
  const pest = pestOf(zone)
  const verdicts = pest
    ? sortVerdicts(registeredDrugs(zone, pest).map((d) => evaluate(d, zone, pest, records, today)))
    : []
  const groups = LIST_ORDER.map((s) => ({ status: s, items: verdicts.filter((v) => v.status === s) })).filter(
    (g) => g.items.length > 0,
  )

  return (
    <div className="page page--nav">
      <AppBar
        title={pest ? `${pest.name} 약` : '약 판정'}
        sub={`${zoneName(zone)} ${zone.crop}`}
      />

      <div className="page__body drug-page">
        <div className="zone-tabs" role="group" aria-label="판정할 구역">
          {farmZones.map((z) => (
            <button
              key={z.id}
              type="button"
              className={`chip${z.id === zone.id ? ' chip--on' : ''}`}
              aria-pressed={z.id === zone.id}
              onClick={() => selectZone(z.id)}
            >
              {zoneName(z)}
              <span className="chip__sub">{z.crop}</span>
            </button>
          ))}
        </div>

        {pest && (
          <Link to="/pests" className="pest-strip">
            <PestPhoto pest={pest} size={52} />
            <span className="pest-strip__body">
              <span className="pest-strip__label">선택한 병해충</span>
              <span className="pest-strip__name">{pest.name}</span>
            </span>
            <span className="pest-strip__change">
              변경
              <Icon name="caret-right" size={16} />
            </span>
          </Link>
        )}

        {verdicts.length > 0 && (
          <ul className="tally" aria-label="판정 결과 개수">
            {groups.map((g) => (
              <li key={g.status} className={`tally__item tally__item--${g.status}`}>
                <Icon name={STATUS_META[g.status].icon} weight="fill" size={18} />
                {STATUS_META[g.status].label}
                <strong>{g.items.length}</strong>
              </li>
            ))}
          </ul>
        )}

        {verdicts.length === 0 ? (
          <div className="empty">
            <Icon name="flask" size={32} />
            <p>
              {pest ? `${zone.crop} ${pest.name}에 등록된 약이 없어요` : `아직 ${zone.crop} 병해충 자료가 없어요`}
            </p>
            <p className="empty__hint">
              {pest?.kind === '바이러스'
                ? '바이러스병은 약으로 못 고쳐요. 옮기는 벌레를 먼저 막아 주세요.'
                : '가까운 농업기술센터에 물어보세요.'}
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.status} className="drug-group" aria-labelledby={`grp-${g.status}`}>
              <h2 id={`grp-${g.status}`} className={`drug-group__title drug-group__title--${g.status}`}>
                <Icon name={STATUS_META[g.status].icon} weight="fill" size={20} />
                {STATUS_META[g.status].label}
                <span>{g.items.length}개</span>
              </h2>
              <ul className="drug-group__list">
                {g.items.map((v) => (
                  <li key={v.drug.id}>
                    <DrugCard v={v} inStock={inventory.includes(v.drug.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
