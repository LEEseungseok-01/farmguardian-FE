import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  DEFAULT_PEST_BY_ZONE, FARMS, INVENTORY, PESTS, RECORDS, TODAY, ZONES,
  type Crop, type Farm, type Pest, type Point, type SprayRecord, type Zone,
} from '../data/mock'

type Toast = { id: number; text: string; actionLabel?: string; actionTo?: string }

type AppState = {
  today: string
  farms: Farm[]
  zones: Zone[]
  records: SprayRecord[]
  inventory: string[]
  /** 창고에 넣고 빼기 */
  toggleInventory: (drugId: string) => void
  currentFarm: Farm
  farmZones: Zone[]
  zone: Zone
  /** 이 작물에 병해충 자료가 없으면 undefined */
  pest: Pest | undefined
  pestOf: (zone: Zone) => Pest | undefined
  setCurrentFarm: (id: string) => void
  selectZone: (id: string) => void
  selectPest: (id: string) => void
  addRecord: (rec: Omit<SprayRecord, 'id'>) => void
  setRecordCancelled: (id: string, cancelled: boolean) => void
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

const firstPestFor = (crop: Crop) => PESTS.find((p) => p.crops.includes(crop) && p.kind !== '바이러스')

export function AppProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState(FARMS)
  const [zones, setZones] = useState(ZONES)
  const [records, setRecords] = useState(RECORDS)
  const [inventory, setInventory] = useState<string[]>(INVENTORY)
  const [currentFarmId, setCurrentFarmId] = useState('f1')
  const [zoneByFarm, setZoneByFarm] = useState<Record<string, string>>({ f1: 'z-a', f2: 'z-2a' })
  const [pestByZone, setPestByZone] = useState(DEFAULT_PEST_BY_ZONE)
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number>(0)

  const currentFarm = farms.find((f) => f.id === currentFarmId) ?? farms[0]
  const farmZones = zones.filter((z) => z.farmId === currentFarm.id)
  const zone = farmZones.find((z) => z.id === zoneByFarm[currentFarm.id]) ?? farmZones[0]

  const pestOf = useCallback(
    (z: Zone) => {
      const p = PESTS.find((x) => x.id === pestByZone[z.id])
      return p && p.crops.includes(z.crop) ? p : firstPestFor(z.crop)
    },
    [pestByZone],
  )

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(timer.current)
    setToast({ ...t, id: Date.now() })
    timer.current = window.setTimeout(() => setToast(null), 4000)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      today: TODAY,
      farms,
      zones,
      records,
      inventory,
      currentFarm,
      farmZones,
      zone,
      pest: pestOf(zone),
      pestOf,
      setCurrentFarm: setCurrentFarmId,
      selectZone: (id) => {
        const z = zones.find((x) => x.id === id)
        if (!z) return
        setCurrentFarmId(z.farmId)
        setZoneByFarm((m) => ({ ...m, [z.farmId]: id }))
      },
      selectPest: (id) => setPestByZone((m) => ({ ...m, [zone.id]: id })),
      toggleInventory: (id) =>
        setInventory((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])),
      addRecord: (rec) => setRecords((list) => [...list, { ...rec, id: `r${Date.now()}` }]),
      setRecordCancelled: (id, cancelled) =>
        setRecords((list) => list.map((x) => (x.id === id ? { ...x, cancelled } : x))),
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
    [farms, zones, records, inventory, currentFarm, farmZones, zone, pestOf, toast, showToast],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppProvider 안에서만 쓸 수 있습니다')
  return v
}
