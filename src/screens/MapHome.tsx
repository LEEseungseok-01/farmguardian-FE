import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { FieldMap } from '../components/FieldMap'
import { Icon } from '../components/Icon'
import { LogoMark } from '../components/Logo'
import { ProductArt } from '../components/ProductArt'
import { StatusBadge } from '../components/StatusBadge'
import { WEATHER, zoneName, type Zone } from '../data/mock'
import { diffDays, fmtMD, num, toPyeong } from '../lib/date'
import { LIST_ORDER, evaluate, registeredDrugs, seasonRecords } from '../lib/verdict'
import { useApp } from '../state/AppState'
import './MapHome.css'

type SheetState = 'open' | 'min'

export default function MapHome() {
  const navigate = useNavigate()
  const { currentFarm, farmZones, zone, selectZone, records, inventory, today, pestOf } = useApp()
  const pest = pestOf(zone)
  const [sheet, setSheet] = useState<SheetState>(() => (window.innerHeight >= 700 ? 'open' : 'min'))
  const topRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const [inset, setInset] = useState({ top: 180, bottom: 440 })

  // 위 카드와 아래 시트에 가리지 않는 영역에 밭이 꽉 차게 그린다
  useLayoutEffect(() => {
    const measure = () => {
      const top = topRef.current?.getBoundingClientRect().bottom ?? 180
      const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? window.innerHeight - 440
      setInset({ top: top + 8, bottom: window.innerHeight - sheetTop + 4 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (topRef.current) ro.observe(topRef.current)
    if (sheetRef.current) ro.observe(sheetRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const crops = [...new Set(farmZones.map((z) => z.crop))].join('·')
  const area = farmZones.reduce((a, z) => a + z.areaM2, 0)

  const zoneTag = (z: Zone) => {
    if (!z.plantedAt || z.plantedAt > today) return '심기 전'
    return z.crop
  }

  return (
    <div className="map-screen">
      <div className="map-stage">
        <FieldMap
          zones={farmZones}
          selectedId={zone.id}
          onSelect={(id) => {
            selectZone(id)
            setSheet('open')
          }}
          zoneLabel={zoneTag}
          ariaLabel={`${currentFarm.name} 구역 지도. 구역을 누르면 선택돼요.`}
          style={{ top: inset.top, height: `calc(100% - ${inset.top + inset.bottom}px)` }}
        />
      </div>

      <div className="map-top" ref={topRef}>
        <div className="map-top__row">
          <Link to="/fields" className="farm-card" aria-label={`${currentFarm.name}, 밭과 구역 관리로 가기`}>
            <LogoMark size={40} />
            <span className="farm-card__text">
              <span className="farm-card__name">
                {currentFarm.name}
                <Icon name="caret-down" size={18} />
              </span>
              <span className="farm-card__meta">
                {num(toPyeong(area))}평 · 구역 {farmZones.length}개
              </span>
            </span>
          </Link>
          <Link to="/fields" className="icon-btn icon-btn--glass" aria-label="밭·구역 관리">
            <Icon name="sliders-horizontal" size={24} />
          </Link>
        </div>

        <section className="weather-card" aria-label="오늘 날씨">
          <div className="weather-card__metrics">
            <span className="wx">
              <Icon name="cloud-sun" size={26} className="wx__icon wx__icon--sun" label={WEATHER.sky} />
              <span className="wx__temp">{WEATHER.temp}°</span>
            </span>
            <span className="wx">
              <Icon name="drop" size={20} className="wx__icon" />
              <span className="wx__label">강수</span>
              <strong>{WEATHER.rainProb}%</strong>
            </span>
            <span className="wx">
              <Icon name="wind" size={20} className="wx__icon" />
              <span className="wx__label">바람</span>
              <strong>초속 {WEATHER.wind}m</strong>
            </span>
          </div>
          <WeatherLine />
        </section>
      </div>

      <ZoneSheet
        ref={sheetRef}
        state={sheet}
        onToggle={() => setSheet((s) => (s === 'open' ? 'min' : 'open'))}
        onSet={setSheet}
        zone={zone}
        today={today}
        recordCount={seasonRecords(zone, records, today).length}
        cards={
          pest
            ? registeredDrugs(zone, pest)
                .map((d) => evaluate(d, zone, pest, records, today))
                .sort(
                  (a, b) =>
                    LIST_ORDER.indexOf(a.status) - LIST_ORDER.indexOf(b.status) ||
                    Number(inventory.includes(b.drug.id)) - Number(inventory.includes(a.drug.id)) ||
                    a.drug.name.localeCompare(b.drug.name, 'ko'),
                )
                .slice(0, 3)
            : []
        }
        inventory={inventory}
        pestName={pest?.name}
        onScan={() => navigate('/map/scan')}
        onPests={() => navigate('/pests')}
      />

      <BottomNav />
      <Outlet />
    </div>
  )
}

type ZoneSheetProps = {
  ref: React.Ref<HTMLElement>
  state: SheetState
  onToggle: () => void
  onSet: (s: SheetState) => void
  zone: Zone
  today: string
  recordCount: number
  cards: ReturnType<typeof evaluate>[]
  inventory: string[]
  pestName?: string
  onScan: () => void
  onPests: () => void
}

/** 한 줄 자리에서 날씨 안내를 번갈아 띄운다. 공지 띠처럼 위로 넘어간다. */
function WeatherLine() {
  const [i, setI] = useState(0)
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (reduce || WEATHER.lines.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % WEATHER.lines.length), 4200)
    return () => clearInterval(t)
  }, [reduce])
  const cur = WEATHER.lines[i]
  return (
    <p className="weather-card__line">
      <StatusBadge status={cur.status} />
      <span className="wx-roll" aria-live="polite">
        <span key={i} className="wx-roll__text">{cur.text}</span>
      </span>
    </p>
  )
}

function ZoneSheet({ ref, state, onToggle, onSet, zone, today, recordCount, cards, inventory, pestName, onScan, onPests }: ZoneSheetProps) {
  const startY = useRef<number | null>(null)
  const planted = !!zone.plantedAt && zone.plantedAt <= today
  const [anim, setAnim] = useState(0)
  useEffect(() => setAnim((n) => n + 1), [zone.id])

  const onDown = (e: PointerEvent) => (startY.current = e.clientY)
  const onUp = (e: PointerEvent) => {
    if (startY.current == null) return
    const dy = e.clientY - startY.current
    startY.current = null
    if (dy > 36) onSet('min')
    else if (dy < -36) onSet('open')
  }

  return (
    <section ref={ref} className="zone-sheet" data-state={state} aria-label={`${zoneName(zone)} 정보`}>
      <button
        type="button"
        className="zone-sheet__handle"
        onClick={onToggle}
        onPointerDown={onDown}
        onPointerUp={onUp}
        aria-expanded={state === 'open'}
        aria-label={state === 'open' ? '구역 정보 접기' : '구역 정보 펼치기'}
      >
        <span aria-hidden="true" />
      </button>

      <div className="zone-sheet__head" key={`h${anim}`}>
        <div className="zone-sheet__title-row">
          <h2 className="zone-sheet__title">{zoneName(zone)}</h2>
          <span className="crop-chip">{zone.crop}</span>
        </div>
        <ul className="zone-stats">
          <li>
            {planted ? '심은 지 ' : '심을 날 '}
            <strong>
              {planted
                ? `${diffDays(today, zone.plantedAt!)}일`
                : zone.plannedAt
                  ? fmtMD(zone.plannedAt)
                  : '미정'}
            </strong>
          </li>
          <li>
            수확까지 <strong>{zone.harvestAt ? `${diffDays(zone.harvestAt, today)}일` : '미정'}</strong>
          </li>
        </ul>
      </div>

      {state === 'open' && (
        <div className="zone-sheet__body">
          <div className="zs-section-head">
            <h3>{pestName ? `${pestName}에 쓸 약` : '쓸 수 있는 약'}</h3>
            <button type="button" className="text-btn" onClick={onPests}>
              {pestName ? '병해충 바꾸기' : '병해충 고르기'}
              <Icon name="caret-right" size={16} />
            </button>
          </div>
          {cards.length === 0 && (
            <p className="muted-box">아직 {zone.crop} 병해충 자료가 없어요. 자료가 들어오면 바로 판정해 드려요.</p>
          )}
          <ul className="inv-list">
            {cards.map((v) => (
              <li key={v.drug.id}>
                <Link to={`/verdict/${v.drug.id}`} className="inv-card">
                  <ProductArt drug={v.drug} size={34} />
                  <span className="inv-card__body">
                    <span className="inv-card__name">{v.drug.name}</span>
                    <span className="inv-card__form">
                      {inventory.includes(v.drug.id) ? '창고에 있음' : v.drug.form}
                    </span>
                    <StatusBadge status={v.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="zone-sheet__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={onScan}>
              <Icon name="camera" size={24} weight="fill" />
              봉지 찍어서 찾기
            </button>
            <button type="button" className="btn btn--soft" onClick={onPests}>
              <Icon name="bug" size={20} />
              병해충으로 찾기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
