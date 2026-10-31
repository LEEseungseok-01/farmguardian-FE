import type { IconName } from '../components/iconPaths'
import { DRUGS, drugById, type Drug, type Pest, type Registration, type SprayRecord, type Zone } from '../data/mock'
import { addDays, diffDays, fmtMD, num } from './date'

export type Status = 'ok' | 'caution' | 'no' | 'unknown' | 'preplant'
export type CheckStatus = Status | 'skip'

/** 여러 상태가 겹치면 센 쪽을 보여준다: 불가 > 심을 때 > 확인 필요 > 주의 > 가능 */
export const PRIORITY: Record<Status, number> = { no: 5, preplant: 4, unknown: 3, caution: 2, ok: 1 }

/** 목록에서는 쓸 수 있는 약이 위로 온다 */
export const LIST_ORDER: Status[] = ['ok', 'caution', 'unknown', 'preplant', 'no']

export const STATUS_META: Record<Status, { label: string; icon: IconName; headline: string; check: string }> = {
  ok: { label: '가능', icon: 'check-circle', headline: '지금 쓸 수 있어요', check: '통과' },
  caution: { label: '주의', icon: 'warning', headline: '조건을 지키면 쓸 수 있어요', check: '주의' },
  no: { label: '불가', icon: 'prohibit', headline: '쓰면 안 돼요', check: '안 됨' },
  unknown: { label: '확인 필요', icon: 'question', headline: '자료가 없어 판단할 수 없어요', check: '자료 없음' },
  preplant: { label: '심을 때', icon: 'plant', headline: '심은 뒤에 판정할 수 있어요', check: '심기 전' },
}

export const worst = (list: Status[]): Status =>
  list.reduce<Status>((a, b) => (PRIORITY[b] > PRIORITY[a] ? b : a), 'ok')

export type CheckKey = 'reg' | 'timing' | 'count' | 'group'
/** tag는 문장 앞에 칩으로 뜨는 짧은 상태말 */
export type Check = { key: CheckKey; label: string; status: CheckStatus; text: string; tag?: string }
export type Fact = { label: string; value: string; sub?: string }

export type Verdict = {
  drug: Drug
  status: Status
  checks: Check[]
  reason: string
  reasonTag?: string
  facts: Fact[]
  reg?: Registration
}

export const WATER_PER_M2 = 0.2 // 10아르당 200 L

/** 이번 농사(심은 날 이후)에 이 구역에 실제로 뿌린 기록. 취소한 기록은 뺀다. */
export function seasonRecords(zone: Zone, records: SprayRecord[], today: string) {
  return records
    .filter(
      (rec) =>
        rec.zoneId === zone.id &&
        !rec.cancelled &&
        rec.date <= today &&
        (!zone.plantedAt || rec.date >= zone.plantedAt),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function evaluate(drug: Drug, zone: Zone, pest: Pest, records: SprayRecord[], today: string): Verdict {
  const season = seasonRecords(zone, records, today)
  const reg = drug.regs.find((x) => x.crop === zone.crop && x.pestId === pest.id)
  const planted = !!zone.plantedAt && zone.plantedAt <= today
  const target = `${zone.crop} ${pest.name}`

  // 1 등록
  let regCheck: Check
  if (drug.regs.length === 0) {
    regCheck = { key: 'reg', label: '등록', status: 'unknown', text: '등록 자료를 찾을 수 없어요.' }
  } else if (!reg) {
    regCheck = { key: 'reg', label: '등록', status: 'no', text: `${target}에는 등록되지 않은 약이에요.` }
  } else {
    regCheck = { key: 'reg', label: '등록', status: 'ok', text: `${target}에 쓰도록 등록된 약이에요.` }
  }

  const water = Math.round(zone.areaM2 * WATER_PER_M2)

  if (!reg) {
    const skip = (key: CheckKey, label: string): Check => ({
      key, label, status: 'skip', text: '등록되지 않아 따지지 않아요.',
    })
    const checks = [regCheck, skip('timing', '시기'), skip('count', '횟수'), skip('group', '계통')]
    return {
      drug,
      status: regCheck.status as Status,
      checks,
      reason: regCheck.text,
      facts: [
        { label: '수확 전 일수', value: '해당 없음' },
        { label: '최대 횟수', value: '해당 없음' },
        { label: '희석', value: '해당 없음' },
        { label: '계통', value: `${drug.group}번`, sub: drug.kind },
      ],
    }
  }

  // 2 시기 (수확 전 일수)
  let timing: Check
  let phiFact: Fact
  const phiText = reg.phi == null ? '자료 없음' : `${reg.phi}일`
  if (!planted) {
    const when = zone.plannedAt ? `${fmtMD(zone.plannedAt)}에 심을 예정이에요.` : '심은 날이 아직 없어요.'
    timing = { key: 'timing', label: '시기', status: 'preplant', text: `아직 심기 전이에요. ${when}` }
    phiFact = { label: '수확 전 일수', value: phiText, sub: '심은 뒤 계산' }
  } else if (reg.phi == null) {
    timing = { key: 'timing', label: '시기', status: 'unknown', text: '수확 전 일수 자료가 없어요.' }
    phiFact = { label: '수확 전 일수', value: '자료 없음' }
  } else if (!zone.harvestAt) {
    timing = { key: 'timing', label: '시기', status: 'unknown', text: '수확 예정일이 없어 따질 수 없어요.' }
    phiFact = { label: '수확 전 일수', value: phiText, sub: '수확일 모름' }
  } else {
    const left = diffDays(zone.harvestAt, today)
    const margin = left - reg.phi
    const canHarvest = fmtMD(addDays(today, reg.phi))
    phiFact = { label: '수확 전 일수', value: phiText, sub: `남은 ${left}일` }
    if (margin < 0) {
      timing = {
        key: 'timing', label: '시기', status: 'no',
        text: `수확까지 ${left}일 남았는데, 이 약은 수확 ${reg.phi}일 전까지만 뿌릴 수 있어요.`,
      }
    } else if (margin <= 2) {
      timing = {
        key: 'timing', label: '시기', status: 'caution',
        text: `오늘 뿌리면 ${canHarvest}부터 수확할 수 있어요. 예정일까지 여유가 ${margin}일뿐이에요.`,
      }
    } else {
      timing = { key: 'timing', label: '시기', status: 'ok', text: `오늘 뿌리면 ${canHarvest}부터 수확할 수 있어요.` }
    }
  }

  // 3 횟수 (같은 성분 기준)
  const used = season.filter((rec) => drugById(rec.drugId)?.ingredient === drug.ingredient).length
  let count: Check
  let countFact: Fact
  if (reg.maxCount == null) {
    count = { key: 'count', label: '횟수', status: 'unknown', text: '최대 살포 횟수 자료가 없어요.' }
    countFact = { label: '최대 횟수', value: '자료 없음', sub: `${used}회 씀` }
  } else {
    const left = reg.maxCount - used
    countFact = { label: '최대 횟수', value: `${reg.maxCount}회 중 ${used}회 씀`, sub: left > 0 ? `${left}회 남음` : '남은 횟수 없음' }
    const usedTag = used === 0 ? '아직 안 씀' : `${used}번 사용`
    if (left <= 0) {
      count = { key: 'count', label: '횟수', status: 'no', tag: usedTag, text: '더 쓸 수 없어요.' }
    } else if (left === 1) {
      count = {
        key: 'count', label: '횟수', status: 'caution',
        tag: used === 0 ? '한 번만 가능' : usedTag,
        text: used === 0 ? '이번 농사에 한 번만 쓸 수 있어요.' : '마지막으로 쓸 수 있어요.',
      }
    } else {
      count = {
        key: 'count', label: '횟수', status: 'ok', tag: usedTag,
        text: used === 0 ? `이번 농사에 ${reg.maxCount}번까지 쓸 수 있어요.` : `${reg.maxCount}번까지라 ${left}번 남았어요.`,
      }
    }
  }

  // 4 계통 (같은 종류 약끼리 비교: 살충제는 살충제끼리)
  const sameKind = season.filter((rec) => drugById(rec.drugId)?.kind === drug.kind)
  const last = sameKind[sameKind.length - 1]
  const prev = sameKind[sameKind.length - 2]
  const lastDrug = last ? drugById(last.drugId) : undefined
  const prevDrug = prev ? drugById(prev.drugId) : undefined
  const everUsed = sameKind.some((rec) => drugById(rec.drugId)?.group === drug.group)
  let group: Check
  let groupSub: string
  const victim = drug.kind === '살균제' ? '병균' : '벌레'
  if (lastDrug && lastDrug.group === drug.group && prevDrug && prevDrug.group === drug.group) {
    group = {
      key: 'group', label: '계통', status: 'no', tag: '두 번 연속',
      text: '세 번째는 안 돼요. 다른 계통을 쓰세요.',
    }
    groupSub = '두 번 연속 사용'
  } else if (lastDrug && lastDrug.group === drug.group) {
    group = {
      key: 'group', label: '계통', status: 'caution', tag: '직전과 같은 계통',
      text: `${lastDrug.name} 다음이라 다른 계통을 써야 해요.`,
    }
    groupSub = '직전과 같음'
  } else if (everUsed) {
    group = { key: 'group', label: '계통', status: 'ok', tag: '직전과 다른 계통', text: `직전에 뿌린 약과 ${victim}을 잡는 방식이 달라요.` }
    groupSub = '직전과 다름'
  } else {
    group = { key: 'group', label: '계통', status: 'ok', tag: '이번 농사 첫 사용', text: '이 계통은 이번 농사에 아직 안 썼어요.' }
    groupSub = '이번 농사 첫 사용'
  }

  const checks = [regCheck, timing, count, group]
  const statuses = checks.map((c) => c.status).filter((s): s is Status => s !== 'skip')
  const status = worst(statuses)
  const strongest = checks
    .filter((c) => c.status !== 'skip' && c.status !== 'ok')
    .sort((a, b) => PRIORITY[b.status as Status] - PRIORITY[a.status as Status])[0]

  return {
    drug,
    status,
    checks,
    reg,
    reason: strongest ? strongest.text : '네 가지 모두 통과했어요.',
    reasonTag: strongest?.tag,
    facts: [
      phiFact,
      countFact,
      {
        label: '희석',
        value: reg.dilution ? `${num(reg.dilution)}배` : '자료 없음',
        sub: `물 ${num(water)} L`,
      },
      { label: '계통', value: `${drug.group}번`, sub: groupSub },
    ],
  }
}

export const registeredDrugs = (zone: Zone, pest: Pest) =>
  DRUGS.filter((d) => d.regs.some((x) => x.crop === zone.crop && x.pestId === pest.id))

export const sortVerdicts = (list: Verdict[]) =>
  [...list].sort((a, b) => LIST_ORDER.indexOf(a.status) - LIST_ORDER.indexOf(b.status) || a.drug.name.localeCompare(b.drug.name, 'ko'))

/** 못 쓰는 약 대신 쓸 수 있는 약. 직전과 다른 계통을 앞에 둔다. */
export function alternatives(v: Verdict, zone: Zone, pest: Pest, records: SprayRecord[], today: string) {
  return registeredDrugs(zone, pest)
    .filter((d) => d.id !== v.drug.id)
    .map((d) => evaluate(d, zone, pest, records, today))
    .filter((x) => x.status === 'ok' || x.status === 'caution')
    .sort(
      (a, b) =>
        PRIORITY[a.status] - PRIORITY[b.status] ||
        Number(a.drug.group === v.drug.group) - Number(b.drug.group === v.drug.group),
    )
    .slice(0, 3)
}

const GROUP_ORDER = ['5', '28', '15', '6', '4', '11', '40', '9', '1', '21', '25', '31', '36']

/** 계통마다 정해진 차트 색 (CSS 변수) */
export const groupColor = (group: string) => {
  const i = GROUP_ORDER.indexOf(group)
  return `var(--chart-${(i < 0 ? GROUP_ORDER.length : i) % 7 + 1})`
}
