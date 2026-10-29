// 날짜는 'YYYY-MM-DD' 문자열로 다룬다. 시간대 영향을 받지 않도록 UTC 일 단위로 계산한다.
const DAY = 86400000

export const toDayNumber = (s: string) =>
  Math.round(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / DAY)

export const diffDays = (a: string, b: string) => toDayNumber(a) - toDayNumber(b)

export const addDays = (s: string, n: number) =>
  new Date((toDayNumber(s) + n) * DAY).toISOString().slice(0, 10)

export const fmtMD = (s: string) => `${+s.slice(5, 7)}월 ${+s.slice(8, 10)}일`

export const fmtFull = (s: string) => `${s.slice(0, 4)}년 ${fmtMD(s)}`

export const fmtDots = (s: string) => s.split('-').join('.')

export const weekday = (s: string) => '일월화수목금토'[new Date(toDayNumber(s) * DAY).getUTCDay()]

export const monthOf = (s: string) => +s.slice(5, 7)

export const toPyeong = (m2: number) => Math.round(m2 / 3.3058)

export const num = (n: number) => n.toLocaleString('ko-KR')
