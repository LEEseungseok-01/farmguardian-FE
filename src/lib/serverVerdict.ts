import type { Drug } from '../data/mock'
import { fmtMD } from './date'
import type { Check, CheckKey, Fact, Status, Verdict } from './verdict'

type ServerStatus = 'OK' | 'CAUTION' | 'BLOCKED' | 'NEEDS_CHECK'

type ServerCheck = {
  key: 'registration' | 'timing' | 'count' | 'moa'
  status: ServerStatus
  message: string
  facts: Record<string, unknown>
}

/** GET /zones/{id}/judgments/preview 한 줄 */
export type PreviewItem = {
  pesticide: {
    id: number
    name: string
    company: string | null
    form: string | null
    ingredients: string[]
    kind: 'insecticide' | 'fungicide' | 'both' | null
    moa: { label_kr: string } | null
  }
  result: { checks: ServerCheck[] }
}

// 서버 판정에는 「심을 때」가 따로 없다. 심은 날이 없으면 「확인 필요」로 온다
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

export function toVerdict(item: PreviewItem): Verdict {
  const p = item.pesticide
  const group = p.moa?.label_kr ?? '미분류'
  const drug: Drug = {
    id: String(p.id),
    name: p.name,
    form: p.form ?? '',
    ingredient: p.ingredients.join(', '),
    percent: '',
    company: p.company ?? '',
    group,
    kind: p.kind === 'fungicide' ? '살균제' : '살충제', // 살충·살균 겸용(both)은 살충제로 본다
    regs: [],
  }
  const checks: Check[] = item.result.checks.map((c) => ({
    ...CHECK[c.key],
    status: STATUS[c.status],
    text: c.message,
  }))
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
  }
}
