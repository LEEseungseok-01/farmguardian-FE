import { Link } from 'react-router-dom'
import { groupColor, type Verdict } from '../lib/verdict'
import { Icon } from './Icon'
import { ProductArt } from './ProductArt'
import { StatusBadge } from './StatusBadge'

/** warn은 이 구역에 직전에 뿌린 약과 같은 계통이라는 뜻 */
export function GroupChip({ group, warn }: { group: string; warn?: boolean }) {
  return (
    <span
      className={`group-chip${warn ? ' group-chip--warn' : ''}`}
      style={{ ['--gc' as string]: groupColor(group) }}
    >
      계통 {group}번
    </span>
  )
}

/** 판정 문장 앞에 붙는 짧은 상태말 */
export function ReasonTag({ children }: { children: string }) {
  return <span className="reason-tag">{children}</span>
}

export function RepeatChip() {
  return <span className="group-chip group-chip--warn group-chip--flat">직전과 같음</span>
}

export function DrugCard({ v, inStock }: { v: Verdict; inStock?: boolean }) {
  const d = v.drug
  const sameGroup = v.checks.find((c) => c.key === 'group')?.status
  return (
    <Link to={`/verdict/${d.id}`} className={`drug-card drug-card--${v.status}`}>
      <ProductArt drug={d} size={44} />
      <span className="drug-card__body">
        <span className="drug-card__top">
          <span className="drug-card__name">{d.name}</span>
          <StatusBadge status={v.status} />
        </span>
        <span className="drug-card__meta">
          <span>{d.form}</span>
          <span>{d.ingredient}</span>
        </span>
        <span className="drug-card__tags">
          <GroupChip group={d.group} warn={sameGroup === 'caution' || sameGroup === 'no'} />
          {inStock && (
            <span className="stock-tag">
              <Icon name="package" size={16} />
              창고에 있음
            </span>
          )}
        </span>
        <span className={`drug-card__reason${v.status === 'ok' ? ' is-ok' : ''}`}>
          {v.reasonTag && <ReasonTag>{v.reasonTag}</ReasonTag>}
          {v.reason}
        </span>
      </span>
    </Link>
  )
}
