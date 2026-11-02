import { useEffect, useState } from 'react'
import type { Pest, Zone } from '../data/mock'
import { useApp } from '../state/AppState'
import { api } from './api'
import { toVerdict, type PreviewItem } from './serverVerdict'
import { evaluate, registeredDrugs, type Verdict } from './verdict'

/** 이 구역·병해충에 등록된 약 전부와 판정. 로그인했으면 서버가, 아니면 예시 데이터로 따진다 */
export function useVerdicts(zone: Zone, pest: Pest | undefined) {
  const { user, records, today } = useApp()
  const key = `${zone.id}:${pest?.id}`
  const [server, setServer] = useState<{ key: string; list: Verdict[]; error: string } | null>(null)

  useEffect(() => {
    if (!user || !pest) return
    let stale = false
    api<PreviewItem[]>(`/zones/${zone.id}/judgments/preview?pest_id=${pest.id}`).then(
      (items) => !stale && setServer({ key, list: items.map(toVerdict), error: '' }),
      (e: Error) => !stale && setServer({ key, list: [], error: e.message }),
    )
    return () => {
      stale = true
    }
  }, [user, key, records]) // eslint-disable-line react-hooks/exhaustive-deps -- key가 zone·pest를 대신한다. 기록이 바뀌면 횟수·계통이 달라져 다시 받는다

  if (!pest) return { verdicts: [] as Verdict[], loading: false, error: '' }
  if (!user) {
    return { verdicts: registeredDrugs(zone, pest).map((d) => evaluate(d, zone, pest, records, today)), loading: false, error: '' }
  }
  const fresh = server?.key === key
  return { verdicts: fresh ? server.list : [], loading: !fresh, error: fresh ? server.error : '' }
}
