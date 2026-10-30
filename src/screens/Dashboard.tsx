import { Link } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { BottomNav } from '../components/BottomNav'
import { DrugCard } from '../components/DrugCard'
import { Icon } from '../components/Icon'
import { REGION_STATS, drugById, zoneName } from '../data/mock'
import { fmtMD } from '../lib/date'
import { eul } from '../lib/korean'
import { evaluate, groupColor, registeredDrugs, seasonRecords } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './Dashboard.css'
import { EmptyArt } from '../components/EmptyArt'

export default function Dashboard() {
  const { currentFarm, farmZones, zone, selectZone, records, today, pestOf, inventory } = useApp()
  const pest = pestOf(zone)

  // 이 구역 이번 농사에 계통을 몇 번씩 썼나. 농가가 아는 건 번호가 아니라 약 이름이라 같이 모은다
  const season = seasonRecords(zone, records, today)
  const counts = new Map<string, { group: string; kind: string; n: number; names: string[] }>()
  for (const r of season) {
    const d = drugById(r.drugId)!
    const key = `${d.kind}-${d.group}`
    const cur = counts.get(key) ?? { group: d.group, kind: d.kind, n: 0, names: [] }
    cur.n += 1
    if (!cur.names.includes(d.name)) cur.names.push(d.name)
    counts.set(key, cur)
  }
  const rows = [...counts.values()].sort((a, b) => b.n - a.n || Number(a.group) - Number(b.group))
  const total = season.length
  const max = rows.length ? rows[0].n : 0
  // 한 계통이 절반을 넘으면 그 줄만 색을 쓴다
  const heavy = total >= 3 && max / total > 0.5 ? rows[0] : undefined

  // 직전에 뿌린 계통. 다음에 쓸 약에서 뒤로 민다
  const last = total ? drugById(season[total - 1].drugId) : undefined
  const next = pest
    ? registeredDrugs(zone, pest)
        .map((d) => evaluate(d, zone, pest, records, today))
        .filter((v) => v.status === 'ok')
        .sort(
          (a, b) =>
            Number(a.drug.group === last?.group) - Number(b.drug.group === last?.group) ||
            Number(inventory.includes(b.drug.id)) - Number(inventory.includes(a.drug.id)),
        )
        .slice(0, 2)
    : []

  // 내 면에서 가장 많이 쓰는 계통. 내가 쓴 것과 겹치면 저항성이 넘어온다
  const county = currentFarm.address.split(' ').find((w) => /[군시]$/.test(w)) ?? ''
  const mine = REGION_STATS.find((r) => r.name === currentFarm.region)
  const [regionTop, regionShare] = mine ? mine.shares.reduce((a, b) => (b[1] > a[1] ? b : a)) : ['', 0]
  const overlap = rows.find((r) => r.group === regionTop)

  return (
    <div className="page page--nav">
      <AppBar title="통계" sub={`${currentFarm.name} · ${fmtMD(today)} 기준`} />

      <div className="page__body dash-page">
        <div className="zone-tabs" role="group" aria-label="구역 고르기">
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

        <section className={`sum${heavy ? ' sum--warn' : ''}`} aria-labelledby="sum-title">
          <h2 id="sum-title" className="sum__label">올해 뿌린 약</h2>
          <p className="sum__big">
            {total}
            <span>회</span>
          </p>
          <p className="sum__line">
            {total === 0
              ? `${zoneName(zone)}에 아직 뿌린 기록이 없어요`
              : heavy
                ? `${eul(heavy.names.length > 1 ? `${heavy.group}번 계통` : heavy.names[0])} ${heavy.n}번 썼어요`
                : rows.length === 1
                  ? `${rows[0].names[0]} 한 가지만 썼어요`
                  : `서로 다른 약 ${rows.length}가지를 돌려 썼어요`}
          </p>

          {rows.length === 0 ? (
            <div className="sum__art">
              <EmptyArt kind="chart" size={124} />
            </div>
          ) : (
            <ul className="mix">
              {rows.map((s) => (
                <li key={`${s.kind}-${s.group}`} className={`mix__row${heavy === s ? ' is-heavy' : ''}`}>
                  <span className="mix__name">
                    {s.names[0]}
                    {s.names.length > 1 && <em>외 {s.names.length - 1}개</em>}
                    <span>
                      {s.kind} {s.group}번 계통
                    </span>
                  </span>
                  <span className="mix__bar">
                    <span style={{ width: `${(s.n / max) * 100}%` }} />
                  </span>
                  <span className="mix__value">{s.n}회</span>
                </li>
              ))}
            </ul>
          )}

          <p className="sum__note">
            {heavy ? (
              <>
                <Icon name="warning" weight="fill" size={18} />
                같은 계통을 거듭 쓰면 그 약에 견디는 벌레만 남아요.
              </>
            ) : (
              <>
                <Icon name="info" size={18} />
                계통은 약이 벌레를 죽이는 방식이에요. 번호가 같으면 성분이 달라도 같은 방식이에요.
              </>
            )}
          </p>
        </section>

        <section aria-labelledby="next-title">
          <h2 id="next-title" className="section-heading section-heading--sm">다음에 쓸 약</h2>
          {next.length ? (
            <>
              <p className="lede">
                {last
                  ? `직전에 ${eul(last.name)} 썼어요. ${last.group}번 계통이라 다른 계통을 먼저 보여 드려요.`
                  : `${pest?.name}에 쓸 수 있는 약이에요.`}
              </p>
              <ul className="drug-group__list">
                {next.map((v) => (
                  <li key={v.drug.id}>
                    <DrugCard v={v} inStock={inventory.includes(v.drug.id)} />
                  </li>
                ))}
              </ul>
              <Link to="/drugs" className="btn btn--soft">
                {pest?.name} 약 모두 보기
                <Icon name="caret-right" size={18} />
              </Link>
            </>
          ) : (
            <p className="muted-box">
              {pest
                ? `지금 ${zone.crop} ${pest.name}에 쓸 수 있는 약이 없어요.`
                : `아직 ${zone.crop} 병해충 자료가 없어요.`}
            </p>
          )}
        </section>

        {mine && (
          <details className={`fold${overlap ? ' fold--warn' : ''}`}>
            <summary>
              이웃 농가는 뭘 쓰나
              {overlap && <em>겹침</em>}
              <span>{county} {zone.crop}, 최근 30일</span>
              <Icon name="caret-down" size={18} />
            </summary>
            <p className="nbr__flag">
              <Icon name={overlap ? 'warning' : 'check-circle'} weight="fill" size={18} />
              {currentFarm.region} 농가 {Math.round(regionShare * 100)}%가 {regionTop}번 계통을 써요
              {overlap ? `. 올해 쓴 ${overlap.names[0]}도 ${regionTop}번이에요` : ''}
            </p>
            <ul className="region-list">
              {REGION_STATS.map((r) => {
                const [g, share] = r.shares.reduce((a, b) => (b[1] > a[1] ? b : a))
                return (
                  <li key={r.name} className={`region-row${r.name === currentFarm.region ? ' is-mine' : ''}`}>
                    <span className="region-row__name">
                      {r.name}
                      {r.name === currentFarm.region && <em>내 밭</em>}
                    </span>
                    <span className="region-row__bar" aria-hidden="true">
                      {r.shares.map(([sg, sv]) => (
                        <span key={sg} style={{ flexGrow: sv, background: groupColor(sg) }} />
                      ))}
                    </span>
                    <span className="region-row__top">
                      {g}번 {Math.round(share * 100)}%
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="fine">막대는 그 면에서 쓰인 계통 비중이에요. 농가 이름은 공개되지 않아요.</p>
          </details>
        )}

        <div className="dash-links">
          <Link to="/history" className="btn btn--soft">
            <Icon name="clock-counter-clockwise" size={20} />
            살포 이력
          </Link>
          <Link to="/fields" className="btn btn--soft">
            <Icon name="sliders-horizontal" size={20} />
            밭 관리
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
