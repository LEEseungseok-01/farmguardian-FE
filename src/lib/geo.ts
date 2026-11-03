import type { Point } from '../data/mock'

/** BE가 주는 MultiPolygon에서 지도에 그릴 테두리를 뽑는다. SVG는 y가 아래로 늘어서 북쪽이 위로 가게 뒤집고,
 *  여러 덩어리면 첫 덩어리의 바깥 테두리만 쓴다 */
export const pointsOf = (g: { coordinates: [number, number][][][] }): Point[] =>
  g.coordinates[0][0].map(([x, y]) => [x, -y])
