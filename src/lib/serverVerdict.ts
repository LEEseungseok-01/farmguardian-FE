import type { Drug } from '../data/mock'
import { fmtMD } from './date'
import type { Check, CheckKey, Fact, Status, Verdict } from './verdict'

type ServerStatus = 'OK' | 'CAUTION' | 'BLOCKED' | 'NEEDS_CHECK'

type ServerCheck = {
  key: 'registration' | 'timing' | 'count' | 'moa'
  status: ServerStatus
  message: string
  facts: Record<string, unknown>
  evidence: { source_text: string }
}

export type ServerPesticide = {
  id: number
  name: string
  company: string | null
  form: string | null
  ingredients: string[]
  kind: 'insecticide' | 'fungicide' | 'both' | null
  moa: { label_kr: string } | null
}

/** GET /zones/{id}/judgments/preview 한 줄 */
export type PreviewItem = { pesticide: ServerPesticide; result: { checks: ServerCheck[] } }

// 서버 판정에는 「심을 때」가 따로 없다. 「확인 필요」에 붙은 facts.reason으로 만든다 (판정 규칙 §5)
const STATUS: Record<ServerStatus, Status> = { OK: 'ok', CAUTION: 'caution', BLOCKED: 'no', NEEDS_CHECK: 'unknown' }
const PRIORITY: Record<Status, number> = { no: 5, preplant: 4, unknown: 3, caution: 2, ok: 1 }
const CHECK: Record<ServerCheck['key'], { key: CheckKey; label: string }> = {
  registration: { key: 'reg', label: '등록' },
  timing: { key: 'timing', label: '시기' },
  count: { key: 'count', label: '횟수' },
  moa: { key: 'group', label: '계통' },
}

const n = (v: unknown) => (typeof v === 'number' ? v : null)

/** 서버가 센 값에서 판정 근거 칸을 만든다. 없는 값은 「자료 없음」 */
function factsOf(checks: ServerCheck[], group: string): Fact[] {
  const by = (k: ServerCheck['key']) => checks.find((c) => c.key === k)?.facts ?? {}
  const timing = by('timing')
  const count = by('count')
  const phi = n(timing.phi_days)
  const from = typeof timing.harvest_from === 'string' ? timing.harvest_from : null
  const max = n(count.max_uses)
  const used = n(count.used)
  const left = n(count.remaining)
  return [
    { label: '수확 전 일수', value: phi == null ? '자료 없음' : `${phi}일`, sub: from ? `${fmtMD(from)}부터 수확` : undefined },
    {
      label: '최대 횟수',
      value: count.no_limit ? '제한 없음' : max == null ? '자료 없음' : `${max}회 중 ${used ?? 0}회 씀`,
      sub: left == null ? undefined : left > 0 ? `${left}회 남음` : '남은 횟수 없음',
    },
    { label: '그룹', value: group },
  ]
}

export const toDrug = (p: ServerPesticide): Drug => ({
  id: String(p.id),
  name: p.name,
  form: p.form ?? '',
  ingredient: p.ingredients.join(', '),
  percent: '',
  company: p.company ?? '',
  group: p.moa?.label_kr ?? '미분류',
  kind: p.kind === 'fungicide' ? '살균제' : '살충제', // 살충·살균 겸용(both)은 살충제로 본다
  regs: [],
})

export function toVerdict(item: PreviewItem): Verdict {
  const drug = toDrug(item.pesticide)
  const group = drug.group
  const checks: Check[] = item.result.checks.map((c) => {
    const check: Check = { ...CHECK[c.key], status: STATUS[c.status], text: c.message }
    const reason = c.facts.reason
    if (c.key === 'timing' && reason === 'at_planting') {
      return { ...check, status: 'preplant', stateLabel: '심을 때', source: c.evidence.source_text }
    }
    if (reason === 'unreadable') return { ...check, source: c.evidence.source_text }
    if (c.key === 'count' && reason === 'no_planting') return { ...check, status: 'preplant' }
    return check
  })
  const flagged = checks
    .filter((c) => c.status !== 'ok')
    .sort((a, b) => PRIORITY[b.status as Status] - PRIORITY[a.status as Status])
  const status = flagged[0] ? (flagged[0].status as Status) : 'ok'
  return {
    drug,
    status,
    checks,
    reason: flagged[0] ? flagged[0].text : '네 가지 모두 통과했어요.',
    facts: factsOf(item.result.checks, group),
    atPlanting: checks.some((c) => c.key === 'timing' && c.stateLabel === '심을 때'),
  }
}
