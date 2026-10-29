// 가짜 데이터. 나중에 API 응답으로 바꾼다.
// 기준일은 고랭지 배추·감자 철에 맞춰 2026년 7월 14일로 고정한다.

export const TODAY = '2026-07-14'

export const DATA_SOURCE = {
  name: '농촌진흥청 농약안전정보시스템',
  asOf: '2026-07-01',
}

/** 고를 수 있는 작물 (구역 하나에 작물 하나). 나중에 API 목록으로 바꾼다. */
export const CROPS = [
  '배추', '무', '감자', '양배추', '당근', '브로콜리', '대파',
  '쪽파', '양파', '마늘', '고추', '파프리카', '토마토', '방울토마토', '오이', '애호박', '단호박',
  '옥수수', '콩', '팥', '들깨', '참깨', '고구마', '메밀',
  '상추', '결구상추', '시금치', '케일', '비트', '콜라비', '셀러리', '아스파라거스', '쌈추',
  '더덕', '도라지', '곤드레', '산마늘', '취나물', '곰취',
  '딸기', '수박', '참외', '사과', '블루베리',
] as const
export type Crop = (typeof CROPS)[number]

/** 고랭지에서 많이 심는 작물 (검색 전 먼저 보여 준다) */
export const POPULAR_CROPS: Crop[] = ['배추', '무', '감자', '양배추', '당근', '브로콜리', '대파']
export type Part = '잎' | '줄기' | '뿌리' | '열매'
export type Point = [number, number]

export type Farm = {
  id: string
  name: string
  address: string
  region: string
}

export type Zone = {
  id: string
  farmId: string
  /** 농가가 직접 붙인 구역 이름 */
  name: string
  crop: Crop
  plantedAt: string | null
  plannedAt?: string
  harvestAt: string | null
  areaM2: number
  points: Point[]
}

export type Pest = {
  id: string
  name: string
  kind: '벌레' | '병' | '바이러스'
  crops: Crop[]
  parts: Part[]
  months: number[]
  peak: number[]
  photo: string
  hint: string
  /** 이 벌레가 옮기는 바이러스 */
  carries?: string
  /** 바이러스병일 때 옮기는 벌레 */
  carrier?: string
}

export type Registration = {
  crop: Crop
  pestId: string
  /** 수확 전 일수. null 이면 자료 없음 */
  phi: number | null
  /** 최대 살포 횟수. null 이면 자료 없음 */
  maxCount: number | null
  /** 희석 배수 */
  dilution: number | null
}

export type Drug = {
  id: string
  name: string
  form: string
  ingredient: string
  percent: string
  company: string
  /** 작용기작 계통 번호 */
  group: string
  kind: '살충제' | '살균제'
  regs: Registration[]
}

export type SprayRecord = {
  id: string
  date: string
  zoneId: string
  drugId: string
  pestId: string
  cancelled?: boolean
  manual?: boolean
}

export const FARMS: Farm[] = [
  { id: 'f1', name: '대관령 윗밭', address: '강원특별자치도 평창군 대관령면 횡계리 산 21', region: '대관령면' },
  { id: 'f2', name: '진부 아랫밭', address: '강원특별자치도 평창군 진부면 하진부리 512', region: '진부면' },
]

export const ZONES: Zone[] = [
  {
    id: 'z-a', farmId: 'f1', name: '개울가', crop: '배추',
    plantedAt: '2026-06-10', harvestAt: '2026-08-15', areaM2: 2100,
    points: [[44, 186], [150, 178], [156, 290], [50, 298]],
  },
  {
    id: 'z-b', farmId: 'f1', name: '가운데', crop: '배추',
    plantedAt: '2026-06-24', harvestAt: '2026-08-26', areaM2: 1800,
    points: [[150, 178], [252, 170], [258, 282], [156, 290]],
  },
  {
    id: 'z-c', farmId: 'f1', name: '감자 큰밭', crop: '감자',
    plantedAt: '2026-05-02', harvestAt: '2026-07-24', areaM2: 2600,
    points: [[50, 298], [352, 275], [358, 392], [58, 410]],
  },
  {
    id: 'z-d', farmId: 'f1', name: '언덕 위', crop: '배추',
    plantedAt: null, plannedAt: '2026-07-20', harvestAt: null, areaM2: 1500,
    points: [[252, 170], [346, 163], [352, 275], [258, 282]],
  },
  {
    id: 'z-2a', farmId: 'f2', name: '앞밭', crop: '감자',
    plantedAt: '2026-04-28', harvestAt: '2026-08-05', areaM2: 3300,
    points: [[60, 190], [200, 176], [214, 380], [70, 396]],
  },
  {
    id: 'z-2b', farmId: 'f2', name: '뒷밭', crop: '배추',
    plantedAt: '2026-06-15', harvestAt: '2026-08-20', areaM2: 2900,
    points: [[200, 176], [330, 166], [344, 366], [214, 380]],
  },
]

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=240&h=240&q=70`

export const PESTS: Pest[] = [
  {
    id: 'p-dbm', name: '배추좀나방', kind: '벌레', crops: ['배추', '무', '양배추', '브로콜리'], parts: ['잎'],
    months: [5, 6, 7, 8, 9], peak: [6, 7, 8], photo: photo('1776550390778-f4b8f767bf17'),
    hint: '작은 애벌레가 잎 뒷면을 갉아 창문처럼 얇게 남겨요',
  },
  {
    id: 'p-cw', name: '배추흰나비', kind: '벌레', crops: ['배추', '무', '양배추', '브로콜리'], parts: ['잎'],
    months: [4, 5, 6, 7, 8, 9], peak: [5, 6, 9], photo: photo('1713637351063-32b07c355f85'),
    hint: '푸른 애벌레가 잎을 크게 뜯어 먹어요',
  },
  {
    id: 'p-baw', name: '파밤나방', kind: '벌레', crops: ['배추', '양배추', '대파'], parts: ['잎', '줄기'],
    months: [7, 8, 9, 10], peak: [8, 9], photo: photo('1578773358317-082a74d18d04'),
    hint: '어린 벌레가 떼로 모여 잎과 순을 먹어요',
  },
  {
    id: 'p-flea', name: '벼룩잎벌레', kind: '벌레', crops: ['배추', '무'], parts: ['잎', '뿌리'],
    months: [4, 5, 6, 7, 8], peak: [5, 6, 7], photo: photo('1713226216920-fd559475a701'),
    hint: '잎에 작은 구멍이 촘촘히 뚫리고 애벌레는 뿌리를 먹어요',
  },
  {
    id: 'p-aphid', name: '복숭아혹진딧물', kind: '벌레', crops: ['배추', '무', '감자', '당근', '대파'], parts: ['잎', '줄기'],
    months: [4, 5, 6, 7, 9, 10], peak: [5, 6], photo: photo('1778071547313-574c44882c91'),
    hint: '새순과 잎 뒷면에 무리 지어 즙을 빨아 먹어요',
    carries: '순무모자이크바이러스 · 감자잎말림바이러스',
  },
  {
    id: 'p-tpm', name: '감자뿔나방', kind: '벌레', crops: ['감자'], parts: ['잎', '열매'],
    months: [6, 7, 8, 9], peak: [7, 8], photo: photo('1775749206427-bf9d4e50864e'),
    hint: '애벌레가 잎과 덩이줄기 속을 파먹어요',
  },
  {
    id: 'p-dm', name: '노균병', kind: '병', crops: ['배추'], parts: ['잎'],
    months: [6, 7, 8, 9, 10], peak: [8, 9], photo: photo('1790215568189-9f0f1b44ae54'),
    hint: '잎에 누런 각진 무늬가 생기고 뒷면에 곰팡이가 피어요',
  },
  {
    id: 'p-sr', name: '무름병', kind: '병', crops: ['배추', '무', '감자', '양배추', '당근'], parts: ['줄기', '뿌리'],
    months: [7, 8, 9], peak: [7, 8], photo: photo('1789045954269-146ce76840ed'),
    hint: '밑동이 물러 썩고 고약한 냄새가 나요',
  },
  {
    id: 'p-cr', name: '뿌리혹병', kind: '병', crops: ['배추', '무', '양배추', '브로콜리'], parts: ['뿌리'],
    months: [6, 7, 8, 9], peak: [7, 8], photo: photo('1752608277928-3d8d6c17327e'),
    hint: '뿌리에 혹이 생기고 한낮에 포기가 시들어요',
  },
  {
    id: 'p-lb', name: '감자역병', kind: '병', crops: ['감자'], parts: ['잎', '줄기', '열매'],
    months: [6, 7, 8], peak: [7], photo: photo('1792760345488-e29e180fb0bd'),
    hint: '잎에 물 먹은 듯한 검은 무늬가 빠르게 번져요',
  },
  {
    id: 'p-mos', name: '모자이크병', kind: '바이러스', crops: ['배추', '무', '감자'], parts: ['잎'],
    months: [5, 6, 7, 8, 9], peak: [6, 7], photo: photo('1604478421163-92e079706e0e'),
    hint: '잎에 짙고 옅은 얼룩이 모자이크처럼 생기고 오그라들어요',
    carrier: 'p-aphid',
  },
]

const r = (crop: Crop, pestId: string, phi: number | null, maxCount: number | null, dilution: number | null): Registration =>
  ({ crop, pestId, phi, maxCount, dilution })

export const DRUGS: Drug[] = [
  {
    id: 'd-delegate', name: '델리게이트', form: '입상수화제', ingredient: '스피네토람', percent: '25%',
    company: '(주)팜한농', group: '5', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 3, 2000), r('배추', 'p-baw', 7, 3, 2000), r('배추', 'p-cw', 7, 3, 2000), r('감자', 'p-tpm', 7, 3, 2000), r('무', 'p-dbm', 7, 3, 2000), r('양배추', 'p-dbm', 7, 3, 2000), r('브로콜리', 'p-dbm', 7, 2, 2000), r('대파', 'p-baw', 14, 2, 2000)],
  },
  {
    id: 'd-exalt', name: '엑설트', form: '액상수화제', ingredient: '스피네토람', percent: '5%',
    company: '동방아그로', group: '5', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 3, 1000), r('배추', 'p-baw', 7, 3, 1000)],
  },
  {
    id: 'd-benevia', name: '베네비아', form: '유상수화제', ingredient: '사이안트라닐리프롤', percent: '10.26%',
    company: '경농', group: '28', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 2, 2000), r('배추', 'p-flea', 7, 2, 2000), r('배추', 'p-aphid', 7, 2, 2000), r('배추', 'p-baw', 7, 2, 2000), r('감자', 'p-aphid', 7, 2, 2000), r('무', 'p-flea', 7, 2, 2000), r('양배추', 'p-baw', 7, 2, 2000)],
  },
  {
    id: 'd-rimon', name: '라이몬', form: '유제', ingredient: '노발루론', percent: '10%',
    company: '한국삼공', group: '15', kind: '살충제',
    regs: [r('배추', 'p-dbm', 14, 2, 2000), r('배추', 'p-baw', 14, 2, 2000), r('배추', 'p-cw', 14, 2, 2000)],
  },
  {
    id: 'd-gladiator', name: '검투사', form: '액상수화제', ingredient: '플루벤디아마이드', percent: '20%',
    company: '농협케미컬', group: '28', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 3, 4000), r('배추', 'p-cw', 7, 3, 4000), r('배추', 'p-baw', 7, 3, 4000)],
  },
  {
    id: 'd-prevathon', name: '프레바톤', form: '액상수화제', ingredient: '클로란트라닐리프롤', percent: '5%',
    company: '(주)팜한농', group: '28', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 2, 2000), r('배추', 'p-cw', 7, 2, 2000), r('감자', 'p-tpm', 7, 2, 2000)],
  },
  {
    id: 'd-dursban', name: '더스반', form: '유제', ingredient: '클로르피리포스', percent: '25%',
    company: '성보화학', group: '1', kind: '살충제',
    regs: [r('배추', 'p-dbm', 35, 2, 1000), r('배추', 'p-flea', 35, 2, 1000)],
  },
  {
    id: 'd-bio', name: '바이오킬', form: '수화제', ingredient: '비티쿠르스타키', percent: '10%',
    company: '동방아그로', group: '11', kind: '살충제',
    regs: [r('배추', 'p-dbm', null, null, 1000), r('배추', 'p-cw', null, null, 1000)],
  },
  {
    id: 'd-delion', name: '델리온', form: '유제', ingredient: '에마멕틴벤조에이트', percent: '2.15%',
    company: '동방아그로', group: '6', kind: '살충제',
    regs: [r('배추', 'p-dbm', 7, 3, 2000), r('배추', 'p-baw', 7, 3, 2000), r('감자', 'p-tpm', 7, 3, 2000)],
  },
  {
    id: 'd-conido', name: '코니도', form: '수화제', ingredient: '이미다클로프리드', percent: '10%',
    company: '경농', group: '4', kind: '살충제',
    regs: [r('배추', 'p-aphid', 14, 2, 2000), r('감자', 'p-aphid', 14, 3, 2000)],
  },
  {
    id: 'd-chess', name: '체스', form: '수화제', ingredient: '피메트로진', percent: '25%',
    company: '농협케미컬', group: '9', kind: '살충제',
    regs: [r('배추', 'p-aphid', 7, 3, 4000), r('감자', 'p-aphid', 7, 3, 4000), r('무', 'p-aphid', 7, 3, 4000), r('당근', 'p-aphid', 14, 2, 4000), r('대파', 'p-aphid', 7, 2, 4000)],
  },
  {
    id: 'd-mospilan', name: '모스피란', form: '수화제', ingredient: '아세타미프리드', percent: '8%',
    company: '동방아그로', group: '4', kind: '살충제',
    regs: [r('배추', 'p-aphid', 7, 3, 2000), r('배추', 'p-flea', 7, 3, 2000), r('감자', 'p-aphid', 7, 3, 2000)],
  },
  {
    id: 'f-forum', name: '포룸', form: '수화제', ingredient: '디메토모르프', percent: '25%',
    company: '경농', group: '40', kind: '살균제',
    regs: [r('배추', 'p-dm', 7, 3, 1000), r('감자', 'p-lb', 7, 4, 1000)],
  },
  {
    id: 'f-ridomil', name: '리도밀골드', form: '입상수화제', ingredient: '메탈락실엠', percent: '25%',
    company: '농협케미컬', group: '4', kind: '살균제',
    regs: [r('배추', 'p-dm', 14, 2, 2000), r('감자', 'p-lb', 14, 3, 2000)],
  },
  {
    id: 'f-amistar', name: '아미스타', form: '액상수화제', ingredient: '아족시스트로빈', percent: '20%',
    company: '(주)팜한농', group: '11', kind: '살균제',
    regs: [r('배추', 'p-dm', 7, 3, 2000), r('감자', 'p-lb', 7, 3, 2000)],
  },
  {
    id: 'f-mirikat', name: '미리카트', form: '액상수화제', ingredient: '사이아조파미드', percent: '9.4%',
    company: '성보화학', group: '21', kind: '살균제',
    regs: [r('감자', 'p-lb', 7, 4, 2000), r('배추', 'p-cr', 30, 1, 2000)],
  },
  {
    id: 'f-agrepto', name: '아그렙토', form: '수화제', ingredient: '스트렙토마이신', percent: '20%',
    company: '농협케미컬', group: '25', kind: '살균제',
    regs: [r('배추', 'p-sr', 14, 3, 1000), r('감자', 'p-sr', 14, 3, 1000), r('무', 'p-sr', 14, 3, 1000), r('양배추', 'p-sr', 14, 2, 1000), r('당근', 'p-sr', 21, 2, 1000)],
  },
  {
    id: 'f-starner', name: '스타너', form: '수화제', ingredient: '옥솔린산', percent: '20%',
    company: '동방아그로', group: '31', kind: '살균제',
    regs: [r('배추', 'p-sr', 21, 2, 1000)],
  },
  {
    id: 'f-nebijin', name: '네비자', form: '분제', ingredient: '플루설파마이드', percent: '0.3%',
    company: '경농', group: '36', kind: '살균제',
    regs: [r('배추', 'p-cr', null, 1, null)],
  },
]

/** 창고에 있는 약 */
export const INVENTORY = ['d-delegate', 'd-exalt', 'd-benevia', 'd-bio', 'f-forum', 'f-amistar']

export const RECORDS: SprayRecord[] = [
  { id: 'r1', date: '2026-06-22', zoneId: 'z-a', drugId: 'd-gladiator', pestId: 'p-dbm' },
  { id: 'r2', date: '2026-07-02', zoneId: 'z-a', drugId: 'd-rimon', pestId: 'p-baw' },
  { id: 'r3', date: '2026-07-05', zoneId: 'z-a', drugId: 'd-benevia', pestId: 'p-dbm', cancelled: true },
  { id: 'r4', date: '2026-07-09', zoneId: 'z-a', drugId: 'd-exalt', pestId: 'p-dbm' },
  { id: 'r5', date: '2026-06-30', zoneId: 'z-b', drugId: 'd-exalt', pestId: 'p-dbm' },
  { id: 'r6', date: '2026-07-08', zoneId: 'z-b', drugId: 'd-delegate', pestId: 'p-dbm' },
  { id: 'r7', date: '2026-06-05', zoneId: 'z-c', drugId: 'd-conido', pestId: 'p-aphid' },
  { id: 'r8', date: '2026-06-20', zoneId: 'z-c', drugId: 'f-forum', pestId: 'p-lb' },
  { id: 'r9', date: '2026-07-01', zoneId: 'z-c', drugId: 'f-amistar', pestId: 'p-lb' },
  { id: 'r10', date: '2026-07-10', zoneId: 'z-c', drugId: 'd-chess', pestId: 'p-aphid', manual: true },
  { id: 'r11', date: '2026-06-12', zoneId: 'z-2a', drugId: 'f-ridomil', pestId: 'p-lb' },
  { id: 'r12', date: '2026-07-03', zoneId: 'z-2b', drugId: 'd-delegate', pestId: 'p-dbm' },
]

/** 구역마다 마지막으로 고른 병해충 */
export const DEFAULT_PEST_BY_ZONE: Record<string, string> = {
  'z-a': 'p-dbm',
  'z-b': 'p-dbm',
  'z-c': 'p-lb',
  'z-d': 'p-dbm',
  'z-2a': 'p-lb',
  'z-2b': 'p-dbm',
}

export const WEATHER = {
  temp: 21,
  sky: '구름 조금',
  rainProb: 20,
  wind: 2.4,
  status: 'ok' as const,
  /** 한 줄 자리에서 번갈아 보여 준다 */
  lines: [
    { status: 'ok' as const, text: '오후 3시 전에 끝내세요. 4시부터 비가 와요' },
    { status: 'ok' as const, text: '바람 약해요. 옆 밭으로 날릴 걱정은 적어요' },
    { status: 'caution' as const, text: '뿌린 뒤 6시간 안에 비가 오면 다시 뿌려야 해요' },
  ],
}

/** 봉지 사진에서 읽은 글자 (가짜). 그대로 보여주기만 하고 판정에는 쓰지 않는다. */
export const SCAN_RESULT = {
  lines: ['(주)팜한농', '델리게이트 입상수화제', '스피네토람 25%', '제조일자 2026.03.11'],
  candidates: [
    { drugId: 'd-delegate', match: '이름 · 성분 · 회사 일치' },
    { drugId: 'd-exalt', match: '성분만 같아요' },
    { drugId: 'd-delion', match: '이름이 비슷해요' },
  ],
}

export type RegionStat = {
  name: string
  farms: number
  /** [계통 번호, 비중] */
  shares: [string, number][]
  col: number
  row: number
}

/** 평창군 읍면별 배추 농가 살충제 계통 사용 비중 (최근 30일) */
export const REGION_STATS: RegionStat[] = [
  { name: '봉평면', farms: 22, col: 1, row: 1, shares: [['28', 0.36], ['5', 0.27], ['15', 0.17], ['6', 0.2]] },
  { name: '용평면', farms: 31, col: 2, row: 1, shares: [['5', 0.38], ['28', 0.3], ['6', 0.18], ['15', 0.14]] },
  { name: '진부면', farms: 47, col: 3, row: 1, shares: [['28', 0.41], ['5', 0.33], ['15', 0.12], ['6', 0.14]] },
  { name: '대관령면', farms: 64, col: 4, row: 1, shares: [['5', 0.46], ['28', 0.29], ['15', 0.13], ['6', 0.12]] },
  { name: '대화면', farms: 12, col: 1, row: 2, shares: [['6', 0.34], ['28', 0.31], ['5', 0.2], ['15', 0.15]] },
  { name: '방림면', farms: 15, col: 2, row: 2, shares: [['28', 0.4], ['6', 0.26], ['5', 0.22], ['15', 0.12]] },
  { name: '평창읍', farms: 9, col: 3, row: 2, shares: [['15', 0.35], ['28', 0.3], ['5', 0.2], ['6', 0.15]] },
  { name: '미탄면', farms: 14, col: 3, row: 3, shares: [['5', 0.39], ['6', 0.25], ['28', 0.24], ['15', 0.12]] },
]

/** 주소 검색 (가짜) */
export const ADDRESS_BOOK = [
  { address: '강원특별자치도 강릉시 왕산면 대기리 산 2-1', hint: '안반데기', areaM2: 6200 },
  { address: '강원특별자치도 평창군 대관령면 횡계리 산 48', hint: '횡계 고랭지', areaM2: 4100 },
  { address: '강원특별자치도 정선군 임계면 반천리 산 8', hint: '반천 고랭지', areaM2: 5300 },
  { address: '강원특별자치도 태백시 창죽동 산 112', hint: '매봉산 바람의 언덕', areaM2: 7800 },
  { address: '강원특별자치도 평창군 진부면 거문리 271', hint: '거문리 들', areaM2: 3600 },
]

export const drugById = (id: string) => DRUGS.find((d) => d.id === id)
export const pestById = (id: string) => PESTS.find((p) => p.id === id)
export const zoneName = (z: Pick<Zone, 'name'>) => z.name
