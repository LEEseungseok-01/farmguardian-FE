import type { Point } from '../data/mock'

/** 새 밭 미리 보기용 사각형. 나중에 팜맵 필지 경계로 바꾼다 */
const PARCEL: Point[] = [[70, 190], [320, 172], [334, 380], [82, 398]]

/** 구역 수마다 정한 격자 모양 [세로 칸, 가로 칸] */
const GRID: Record<number, [number, number]> = {
  1: [1, 1],
  2: [2, 1],
  3: [3, 1],
  4: [2, 2],
  5: [5, 1],
  6: [3, 2],
}

export type Split = { xs: number[]; ys: number[] }

/** 칸을 n개로 똑같이 나눌 때 경계선이 서는 자리 (퍼센트) */
const even = (n: number) => Array.from({ length: n - 1 }, (_, i) => Math.round(((i + 1) / n) * 100))

export const evenSplit = (n: number): Split => {
  const [cols, rows] = GRID[n] ?? [n, 1]
  return { xs: even(cols), ys: even(rows) }
}

/** 사각형 안의 (u, v) 자리. 네 꼭짓점을 이어 보간한다 */
function at(u: number, v: number): Point {
  const [a, b, c, d] = PARCEL
  const tx = a[0] + (b[0] - a[0]) * u
  const ty = a[1] + (b[1] - a[1]) * u
  const bx = d[0] + (c[0] - d[0]) * u
  const by = d[1] + (c[1] - d[1]) * u
  return [Math.round(tx + (bx - tx) * v), Math.round(ty + (by - ty) * v)]
}

/**
 * 밭 사각형을 구역 수만큼 격자로 자른다.
 * 경계선 자리가 구역 수와 안 맞으면 똑같이 나눈 자리를 쓴다.
 */
export function splitParcel(n: number, split?: Split) {
  const [cols, rows] = GRID[n] ?? [n, 1]
  const xs = split?.xs.length === cols - 1 ? split.xs : even(cols)
  const ys = split?.ys.length === rows - 1 ? split.ys : even(rows)
  const bx = [0, ...xs.map((v) => v / 100), 1]
  const by = [0, ...ys.map((v) => v / 100), 1]
  return Array.from({ length: n }, (_, i) => {
    const [u0, u1] = [bx[i % cols], bx[(i % cols) + 1]]
    const [v0, v1] = [by[Math.floor(i / cols)], by[Math.floor(i / cols) + 1]]
    return {
      points: [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)],
      /** 밭 전체 넓이에서 이 조각이 차지하는 몫 */
      ratio: (u1 - u0) * (v1 - v0),
    }
  })
}
