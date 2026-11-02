import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  DEFAULT_PEST_BY_ZONE, FARMS, INVENTORY, PESTS, RECORDS, TODAY, ZONES,
  type Crop, type Farm, type Pest, type Point, type SprayRecord, type Zone,
} from '../data/mock'
import { api } from '../lib/api'
import { pointsOf } from '../lib/geo'
import { toDrug, type ServerPesticide } from '../lib/serverVerdict'

type Toast = { id: number; text: string; actionLabel?: string; actionTo?: string }

type User = { id: number; username: string }

type ServerField = {
  id: number
  name: string
  address: string | null
  zones: {
    id: number
    name: string
    crop: { id: number; name: string }
    planted_at: string | null
    harvest_at: string | null
    area_m2: number
    geometry: { coordinates: [number, number][][][] }
  }[]
}

type ServerSpray = {
  id: number
  pesticide: ServerPesticide
  pest: { id: number } | null
  sprayed_on: string
  source: 'manual' | 'app'
  cancelled: boolean
}

type ServerPest = {
  id: number
  name: string
  kind: string | null
  photo_url: string | null
  description: string | null
  months: number[]
  pesticide_count: number
  is_virus: boolean
  carries: { name: string }[]
  vectors: { id: number }[]
}

// 새로고침해도 로그인이 풀리지 않게 남겨 둔다. 사파리 비공개 모드에서는 던지므로 감싼다
const readUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('fg.user') ?? 'null')
  } catch {
    return null
  }
}

// 한국 시간 기준 오늘 (YYYY-MM-DD). BE가 판정에 쓰는 날과 같다
const todayKst = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())

const toRecord = (s: ServerSpray, zoneId: string): SprayRecord => ({
  id: String(s.id),
  date: s.sprayed_on,
  zoneId,
  drugId: String(s.pesticide.id),
  pestId: s.pest ? String(s.pest.id) : '',
  cancelled: s.cancelled || undefined,
  manual: s.source === 'manual' || undefined,
  drug: toDrug(s.pesticide),
})

// ponytail: 구역마다 최근 100건만 받는다. 더 쌓이면 페이지를 넘기며 받는다
async function loadSprays(zones: Zone[]): Promise<SprayRecord[]> {
  const pages = await Promise.all(
    zones.map(async (z) => (await api<{ items: ServerSpray[] }>(`/zones/${z.id}/sprays?limit=100`)).items.map((s) => toRecord(s, z.id))),
  )
  return pages.flat()
}

const NO_FARM: Farm = { id: '', name: '', address: '', region: '' }

const toPest = (p: ServerPest, crop: Crop): Pest => ({
  id: String(p.id),
  name: p.name,
  kind: p.is_virus ? '바이러스' : p.kind === '병' ? '병' : '벌레',
  crops: [crop],
  parts: [], // 부위는 /pests/candidates로 따로 거른다
  months: p.months,
  peak: [], // BE에는 많이 생기는 달 구분이 없다
  photo: p.photo_url ?? '',
  hint: p.description ?? '',
  carries: p.carries.map((c) => c.name).join(', ') || undefined,
  carrier: p.vectors[0] ? String(p.vectors[0].id) : undefined,
  drugCount: p.pesticide_count,
})

/** 구역에 심은 작물마다 병해충을 받아 와서, 여러 작물에 나오는 병해충은 하나로 합친다 */
async function loadPests(zones: Zone[]): Promise<Pest[]> {
  const crops = [...new Map(zones.map((z) => [z.cropId, z.crop])).entries()]
  const lists = await Promise.all(
    crops.map(async ([id, crop]) => (await api<ServerPest[]>(`/pests?crop_id=${id}`)).map((p) => toPest(p, crop))),
  )
  const merged = new Map<string, Pest>()
  for (const p of lists.flat()) {
    const have = merged.get(p.id)
    merged.set(p.id, have ? { ...have, crops: [...have.crops, ...p.crops] } : p)
  }
  return [...merged.values()]
}

/** BE의 밭·구역을 화면이 쓰는 모양으로 바꾼다. 읍·면·동은 주소에서 뽑는다 */
function fromServer(fields: ServerField[]) {
  const farms: Farm[] = fields.map((f) => ({
    id: String(f.id),
    name: f.name,
    address: f.address ?? '',
    region: f.address?.split(' ').find((w) => /[면읍동]$/.test(w)) ?? '',
  }))
  const zones: Zone[] = fields.flatMap((f) =>
    f.zones.map((z) => ({
      id: String(z.id),
      farmId: String(f.id),
      name: z.name,
      crop: z.crop.name as Crop,
      cropId: z.crop.id,
      plantedAt: z.planted_at,
      harvestAt: z.harvest_at,
      areaM2: z.area_m2,
      points: pointsOf(z.geometry),
    })),
  )
  return { farms, zones }
}

type AppState = {
  today: string
  /** 가입한 사용자. 둘러보기로 들어오면 null. id는 BE 호출 때 X-User-Id 헤더로 쓴다 */
  user: User | null
  signedIn: boolean
  signIn: (user: User) => void
  signOut: () => void
  /** 로그인했다면 밭·구역을 서버에서 다 받았는지 */
  ready: boolean
  loadError: string
  reload: () => void
  /** 구역이 아직 없는 밭 (가입 직후). 있으면 구역부터 나눠야 한다 */
  unzoned: Farm | undefined
  pests: Pest[]
  pestById: (id: string) => Pest | undefined
  farms: Farm[]
  zones: Zone[]
  records: SprayRecord[]
  inventory: string[]
  /** 창고에 넣고 빼기 */
  toggleInventory: (drugId: string) => Promise<boolean>
  currentFarm: Farm
  farmZones: Zone[]
  zone: Zone
  /** 이 작물에 병해충 자료가 없으면 undefined */
  pest: Pest | undefined
  pestOf: (zone: Zone) => Pest | undefined
  setCurrentFarm: (id: string) => void
  selectZone: (id: string) => void
  selectPest: (id: string) => void
  /** 저장에 성공했는지. 실패하면 이유를 알림으로 띄운다 */
  addRecord: (rec: Omit<SprayRecord, 'id' | 'drug'>) => Promise<boolean>
  setRecordCancelled: (id: string, cancelled: boolean) => Promise<boolean>
  updateZone: (id: string, patch: Partial<Zone>) => void
  /** 작물을 바꾸고 그 구역 기록을 지운다 (되돌릴 수 없음) */
  changeCrop: (id: string, crop: Crop) => void
  /** 구역과 그 구역 기록을 지운다 (되돌릴 수 없음) */
  deleteZone: (id: string) => void
  addFarm: (input: {
    name: string
    address: string
    region: string
    zones: { name: string; crop: Crop; areaM2: number; points: Point[] }[]
  }) => string
  toast: Toast | null
  showToast: (t: Omit<Toast, 'id'>) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>(() => (readUser() ? [] : FARMS))
  const [zones, setZones] = useState<Zone[]>(() => (readUser() ? [] : ZONES))
  const [pests, setPests] = useState<Pest[]>(() => (readUser() ? [] : PESTS))
  const [records, setRecords] = useState<SprayRecord[]>(() => (readUser() ? [] : RECORDS))
  const [inventory, setInventory] = useState<string[]>(() => (readUser() ? [] : INVENTORY))
  const [currentFarmId, setCurrentFarmId] = useState(() => (readUser() ? '' : 'f1'))
  const [zoneByFarm, setZoneByFarm] = useState<Record<string, string>>({ f1: 'z-a', f2: 'z-2a' })
  const [pestByZone, setPestByZone] = useState(DEFAULT_PEST_BY_ZONE)
  const [user, setUser] = useState<User | null>(readUser)
  const [ready, setReady] = useState(user === null)
  const [loadError, setLoadError] = useState('')
  const setAuth = useCallback((u: User | null) => {
    setUser(u)
    try {
      if (u) localStorage.setItem('fg.user', JSON.stringify(u))
      else localStorage.removeItem('fg.user')
    } catch {
      /* 저장 못 해도 이번 세션은 돌아간다 */
    }
  }, [])
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number>(0)

  // 로그인하면 밭·구역은 서버 것이다. 로그아웃하면 다시 예시 데이터로 돌아간다
  const reload = useCallback(() => {
    if (!user) {
      setFarms(FARMS)
      setZones(ZONES)
      setPests(PESTS)
      setRecords(RECORDS)
      setInventory(INVENTORY)
      setCurrentFarmId('f1')
      setReady(true)
      return
    }
    setReady(false)
    setLoadError('')
    api<ServerField[]>('/fields')
      .then(async (fields) => {
        const next = fromServer(fields)
        const [loaded, sprays, stock] = await Promise.all([
          loadPests(next.zones),
          loadSprays(next.zones),
          api<number[]>('/inventory'),
        ])
        setFarms(next.farms)
        setZones(next.zones)
        setPests(loaded)
        setRecords(sprays)
        setInventory(stock.map(String))
        setCurrentFarmId((id) => (next.farms.some((f) => f.id === id) ? id : (next.farms[0]?.id ?? '')))
        setReady(true)
      })
      .catch((e: Error) => setLoadError(e.message))
  }, [user])
  useEffect(reload, [reload])

  // ready 전에는 화면이 그려지지 않으므로, 밭이나 구역이 비어 있어도 아래 값을 쓰는 곳은 없다
  const currentFarm = farms.find((f) => f.id === currentFarmId) ?? farms[0] ?? NO_FARM
  const farmZones = zones.filter((z) => z.farmId === currentFarm.id)
  const zone = farmZones.find((z) => z.id === zoneByFarm[currentFarm.id]) ?? farmZones[0]
  const unzoned = farms.find((f) => !zones.some((z) => z.farmId === f.id))

  const pestById = useCallback((id: string) => pests.find((p) => p.id === id), [pests])
  const pestOf = useCallback(
    (z: Zone) => {
      const p = pestById(pestByZone[z.id])
      return p && p.crops.includes(z.crop)
        ? p
        : pests.find((x) => x.crops.includes(z.crop) && x.kind !== '바이러스')
    },
    [pestByZone, pestById, pests],
  )

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(timer.current)
    setToast({ ...t, id: Date.now() })
    timer.current = window.setTimeout(() => setToast(null), 4000)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      today: user ? todayKst() : TODAY,
      farms,
      zones,
      records,
      inventory,
      user,
      signedIn: user !== null,
      signIn: setAuth,
      signOut: () => setAuth(null),
      ready,
      loadError,
      reload,
      unzoned,
      currentFarm,
      farmZones,
      zone,
      pest: zone ? pestOf(zone) : undefined,
      pests,
      pestById,
      pestOf,
      setCurrentFarm: setCurrentFarmId,
      selectZone: (id) => {
        const z = zones.find((x) => x.id === id)
        if (!z) return
        setCurrentFarmId(z.farmId)
        setZoneByFarm((m) => ({ ...m, [z.farmId]: id }))
      },
      selectPest: (id) => setPestByZone((m) => ({ ...m, [zone.id]: id })),
      toggleInventory: async (id) => {
        const has = inventory.includes(id)
        if (user) {
          try {
            await (has
              ? api(`/inventory/${id}`, { method: 'DELETE' })
              : api('/inventory', { method: 'POST', body: JSON.stringify({ drug_id: Number(id) }) }))
          } catch (e) {
            showToast({ text: (e as Error).message })
            return false
          }
        }
        setInventory((list) => (has ? list.filter((x) => x !== id) : [...list, id]))
        return true
      },
      addRecord: async (rec) => {
        if (!user) {
          setRecords((list) => [...list, { ...rec, id: `r${Date.now()}` }])
          return true
        }
        try {
          const s = await api<ServerSpray>(`/zones/${rec.zoneId}/sprays`, {
            method: 'POST',
            body: JSON.stringify({
              pesticide_id: Number(rec.drugId),
              pest_id: rec.pestId ? Number(rec.pestId) : null,
              sprayed_on: rec.date,
              source: rec.manual ? 'manual' : 'app',
              request_id: crypto.randomUUID(),
            }),
          })
          setRecords((list) => [...list, toRecord(s, rec.zoneId)])
          return true
        } catch (e) {
          showToast({ text: (e as Error).message })
          return false
        }
      },
      setRecordCancelled: async (id, cancelled) => {
        const rec = records.find((x) => x.id === id)
        if (user && rec) {
          try {
            await api(`/zones/${rec.zoneId}/sprays/${id}${cancelled ? '' : '/restore'}`, {
              method: cancelled ? 'DELETE' : 'POST',
            })
          } catch (e) {
            showToast({ text: (e as Error).message })
            return false
          }
        }
        setRecords((list) => list.map((x) => (x.id === id ? { ...x, cancelled } : x)))
        return true
      },
      updateZone: (id, patch) => setZones((list) => list.map((z) => (z.id === id ? { ...z, ...patch } : z))),
      changeCrop: (id, crop) => {
        setZones((list) => list.map((z) => (z.id === id ? { ...z, crop } : z)))
        setRecords((list) => list.filter((r) => r.zoneId !== id))
      },
      deleteZone: (id) => {
        setZones((list) => list.filter((z) => z.id !== id))
        setRecords((list) => list.filter((r) => r.zoneId !== id))
      },
      addFarm: ({ name, address, region, zones: newZones }) => {
        const id = `f${Date.now()}`
        const made: Zone[] = newZones.map((z, i) => ({
          id: `${id}-${i}`,
          farmId: id,
          name: z.name,
          crop: z.crop,
          plantedAt: null,
          harvestAt: null,
          areaM2: z.areaM2,
          points: z.points,
        }))
        setFarms((list) => [...list, { id, name, address, region }])
        setZones((list) => [...list, ...made])
        setZoneByFarm((m) => ({ ...m, [id]: made[0].id }))
        return id
      },
      toast,
      showToast,
    }),
    [farms, zones, pests, pestById, records, inventory, user, setAuth, ready, loadError, reload, unzoned, currentFarm, farmZones, zone, pestOf, toast, showToast],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppProvider 안에서만 쓸 수 있습니다')
  return v
}
