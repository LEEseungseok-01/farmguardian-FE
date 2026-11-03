import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../state/AppState'
import { Icon } from './Icon'
import type { IconName } from './iconPaths'
import './Tour.css'

const OFF = 'fg.tour.off'
const SEEN = 'fg.tour.seen'

type Step = {
  /** 비추는 대상. 화면에 없으면 그 칸은 건너뛴다 */
  sel: string
  icon: IconName
  title: string
  body: string
  /** 구멍을 대상보다 얼마나 넓게 뚫을지 */
  pad?: number
}

// 화면마다 따로. 위에서 아래로 훑어야 구멍이 튀지 않는다
const TOURS: Record<string, Step[]> = {
  '/map': [
    {
      sel: '.map-top',
      icon: 'cloud-sun',
      title: '밭과 오늘 날씨',
      body: '밭 이름을 누르면 다른 밭으로 바꿔요. 아래 줄은 오늘 뿌려도 되는 날인지 알려 줘요.',
    },
    {
      sel: '.map-stage .field-map',
      icon: 'polygon',
      title: '구역마다 따로 봐요',
      body: '지도에서 구역을 누르면 그 구역 기준으로 판정이 바뀌어요. 심은 날과 뿌린 기록이 구역마다 따로 쌓여요.',
      pad: 2,
    },
    {
      sel: '.zone-sheet',
      icon: 'seal-check',
      title: '답은 여기에 나와요',
      body: '고른 구역에 쓸 수 있는 약과 판정이 올라와요. 위로 올리면 더 보여요.',
      pad: 0,
    },
    {
      sel: '.bottom-nav',
      icon: 'map-trifold',
      title: '아래로 옮겨 다녀요',
      body: '약을 직접 찾거나, 뿌린 기록과 통계를 봐요.',
      pad: 0,
    },
  ],

  '/pests': [
    {
      sel: '.search',
      icon: 'magnifying-glass',
      title: '이름으로 바로 찾아요',
      body: '초성만 쳐도 돼요. ㅂㅊ 를 치면 배추좀나방이 나와요.',
    },
    {
      sel: '.part-grid',
      icon: 'leaf',
      title: '어디에 증상이 있나',
      body: '이름을 모를 때 써요. 잎, 줄기, 열매처럼 눈에 보이는 자리로 좁혀요.',
    },
    {
      sel: '.pest-list > li',
      icon: 'bug',
      title: '고르면 약 목록으로 넘어가요',
      body: '바이러스병은 약으로 못 고쳐요. 그럴 때는 옮기는 벌레를 대신 알려 줘요.',
    },
  ],

  '/drugs': [
    {
      sel: '.zone-tabs',
      icon: 'polygon',
      title: '구역을 먼저 골라요',
      body: '구역마다 심은 날과 뿌린 기록이 달라서 같은 약도 판정이 갈려요.',
    },
    {
      sel: '.pest-strip',
      icon: 'bug',
      title: '어떤 병해충인지',
      body: '고른 병해충에 등록된 약만 보여 줘요. 바꾸기를 누르면 다른 병해충으로 넘어가요.',
    },
    {
      sel: '.tally',
      icon: 'check-circle',
      title: '판정으로 걸러요',
      body: '쓸 수 있는 약만 보려면 가능을 누르세요. 한 번 더 누르면 전체로 돌아와요.',
    },
    {
      sel: '.drug-group__list > li',
      icon: 'seal-check',
      title: '약을 누르면 근거가 나와요',
      body: '등록, 시기, 횟수, 계통 네 가지를 따로 보여 줘요. 어느 쪽이 걸렸는지 바로 알 수 있어요.',
    },
  ],

  '/verdict': [
    {
      sel: '.verdict-hero',
      icon: 'seal-check',
      title: '맨 위 한 줄 답',
      body: '써도 되는지 아닌지를 맨 위에 둬요. 색과 글이 같은 뜻이에요.',
    },
    {
      sel: '.checks',
      icon: 'check-circle',
      title: '네 가지 확인',
      body: '등록, 시기, 횟수, 계통이에요. 하나라도 걸리면 어느 쪽인지 여기서 보여요.',
    },
    {
      sel: '.facts',
      icon: 'clipboard-text',
      title: '판정 근거와 출처',
      body: '수확 전 일수, 남은 횟수, 희석 배수를 그대로 보여 줘요. 어느 자료에서 왔는지도 아래에 적혀 있어요.',
    },
    {
      sel: '.cta-bar',
      icon: 'note-pencil',
      title: '뿌렸으면 눌러 두세요',
      body: '눌러야 횟수에 들어가요. 다음 판정이 이 기록을 보고 달라져요.',
      pad: 0,
    },
  ],

  '/history': [
    {
      sel: '.zone-tabs',
      icon: 'polygon',
      title: '구역으로 걸러요',
      body: '전체를 누르면 이 밭 기록이 한 번에 보여요.',
    },
    {
      sel: '.hist-sum',
      icon: 'clock-counter-clockwise',
      title: '올해 몇 번 뿌렸나',
      body: '취소한 기록은 이 횟수에서 빠져요.',
    },
    {
      sel: '.rec-list > li',
      icon: 'note-pencil',
      title: '잘못 적었으면 고쳐요',
      body: '취소해도 지워지지 않고 취소 표시로 남아요. 농약관리법상 증빙이라 보관해야 해요.',
    },
    {
      sel: '.fab-bar',
      icon: 'plus',
      title: '앱 밖에서 뿌린 것도 넣어요',
      body: '판정을 거치지 않고 뿌린 약은 여기서 직접 적어요. 그래야 횟수가 맞아요.',
      pad: 0,
    },
  ],

  '/fields': [
    {
      sel: '.farm-list',
      icon: 'map-pin',
      title: '내 밭 목록',
      body: '여기서 고른 밭이 지도와 판정의 기준이 돼요.',
    },
    {
      sel: '.zone-edit__dates',
      icon: 'calendar-blank',
      title: '심은 날과 수확 예정일',
      body: '이 두 날짜로 수확 가능일을 셈해요. 심은 날이 비어 있으면 판정이 심기 전으로 나와요.',
    },
    {
      sel: '.zone-edit__delete',
      icon: 'trash',
      title: '지우면 기록도 같이 지워져요',
      body: '구역을 지우면 그 구역에 쌓인 살포 기록이 함께 사라져요. 되돌릴 수 없어요.',
    },
  ],

  '/dashboard': [
    {
      sel: '.sum',
      icon: 'chart-pie-slice',
      title: '계통이 한쪽에 몰렸나',
      body: '올해 뿌린 약을 계통별로 세어 막대로 보여 줘요. 한 계통에 몰리면 그 줄 색이 바뀌어요.',
    },
    {
      sel: '[aria-labelledby="next-title"]',
      icon: 'seal-check',
      title: '다음에 쓸 약',
      body: '직전에 쓴 약과 계통이 겹치지 않는 쪽을 먼저 올려요.',
    },
    {
      sel: '.fold',
      icon: 'trend-up',
      title: '이웃 농가는 뭘 쓰나',
      body: '같은 시군 같은 작물 기록이에요. 옆 밭에서 많이 쓴 계통은 내 밭에서 처음 써도 덜 들을 수 있어요.',
    },
  ],
}

/** 판정 화면은 약마다 주소가 달라서 하나로 묶는다 */
const routeKey = (p: string) => (p.startsWith('/verdict/') ? '/verdict' : p)

const isOff = () => {
  try {
    return localStorage.getItem(OFF) === '1'
  } catch {
    return false
  }
}

const turnOffAll = () => {
  try {
    localStorage.setItem(OFF, '1')
  } catch {
    /* 저장 못 해도 이번 세션은 닫힌다 */
  }
}

// 로그인한 사람은 기기에 남긴다. 둘러보는 사람은 창을 닫으면 지워져서 다음에 또 본다
const seenBox = (signedIn: boolean) => (signedIn ? localStorage : sessionStorage)

const seenPaths = (signedIn: boolean): string[] => {
  try {
    const v = JSON.parse(seenBox(signedIn).getItem(SEEN) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

const markSeen = (signedIn: boolean, key: string) => {
  try {
    const list = seenPaths(signedIn)
    if (!list.includes(key)) seenBox(signedIn).setItem(SEEN, JSON.stringify([...list, key]))
  } catch {
    /* 못 적으면 다음에 한 번 더 뜰 뿐이다 */
  }
}

/** 설정에서 다시 보기를 누르면 지운다. 끈 것도 본 것도 모두 되살린다 */
export const resetTour = () => {
  try {
    localStorage.removeItem(OFF)
    localStorage.removeItem(SEEN)
    sessionStorage.removeItem(SEEN)
  } catch {
    /* 못 지우면 다시 뜨지 않을 뿐이다 */
  }
}

type Hole = { top: number; left: number; width: number; height: number }

export function Tour() {
  const { pathname } = useLocation()
  const { signedIn, ready, onboarded, unzoned } = useApp()
  const key = routeKey(pathname)
  const [steps, setSteps] = useState<Step[]>([])
  const [i, setI] = useState(0)
  const [hole, setHole] = useState<Hole | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const shut = useCallback(() => {
    setSteps([])
    setHole(null)
  }, [])

  const close = useCallback(() => {
    markSeen(signedIn, key)
    shut()
  }, [signedIn, key, shut])

  const turnOff = useCallback(() => {
    turnOffAll()
    shut()
  }, [shut])

  // 화면이 바뀌면 열린 안내를 닫고, 그 화면 안내를 새로 연다
  useEffect(() => {
    setSteps([])
    setHole(null)
    const tour = TOURS[key]
    if (!tour || isOff() || seenPaths(signedIn).includes(key)) return
    // 밭을 받아 오는 중이거나 온보딩·구역 나누기가 먼저면 이 화면은 아직 안 그려진다.
    // 끝나면 아래 값이 바뀌면서 다시 들어온다
    if (!ready || !onboarded || unzoned) return

    // BE 응답을 기다리는 동안은 화면이 아직 없다. 하나라도 생겨야 재기 시작한다
    let alive = true
    let tries = 0
    const look = () => {
      if (!alive) return
      if (!tour.some((s) => document.querySelector(s.sel))) {
        if (++tries < 15) window.setTimeout(look, 400)
        return
      }
      // 나머지 칸과 시트가 따라 붙을 틈을 준다
      window.setTimeout(() => {
        if (!alive) return
        setSteps(tour.filter((s) => document.querySelector(s.sel)))
        setI(0)
      }, 500)
    }
    window.setTimeout(look, 300)
    return () => {
      alive = false
    }
  }, [key, signedIn, ready, onboarded, unzoned])

  const step = steps[i]

  // 대상을 화면 안으로 끌어온 뒤 잰다. 시트가 늘었다 줄어도 구멍이 같이 움직인다
  useLayoutEffect(() => {
    if (!step) return
    const el = document.querySelector(step.sel)
    if (!el) return
    el.scrollIntoView({ block: 'center' })
    const pad = step.pad ?? 8
    const measure = () => {
      const r = el.getBoundingClientRect()
      setHole({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [step])

  // 안내가 떠 있는 동안은 뒤 화면이 굴러가지 않게 막는다. 구멍이 어긋난다
  useEffect(() => {
    if (!step) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nextRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [step, close])

  if (!step || !hole) return null

  const last = i === steps.length - 1

  // 구멍을 가리지 않는 쪽에 둔다. 양쪽 다 좁으면 (지도처럼 큰 대상) 아래에 붙인다
  const below = window.innerHeight - (hole.top + hole.height)
  const place =
    below > 250
      ? { top: hole.top + hole.height + 14 }
      : hole.top > 250
        ? { bottom: window.innerHeight - hole.top + 14 }
        : undefined

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour__veil" />
      <div className="tour__hole" style={hole} />

      <div key={i} className={`tour__card${place ? '' : ' tour__card--pin'}`} style={place}>
        <p className="tour__count">
          <Icon name={step.icon} size={20} />
          <span>
            {i + 1} / {steps.length}
          </span>
        </p>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <p className="tour__body">{step.body}</p>

        <div className="tour__foot">
          <span className="tour__dots" aria-hidden="true">
            {steps.map((s, n) => (
              <span key={s.sel} className={n === i ? 'is-on' : undefined} />
            ))}
          </span>
          {!last && (
            <button type="button" className="btn btn--ghost" onClick={close}>
              건너뛰기
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            className="btn btn--primary"
            onClick={() => (last ? close() : setI(i + 1))}
          >
            {last ? '다 봤어요' : '다음'}
            {!last && <Icon name="arrow-right" size={20} />}
          </button>
        </div>

        <button type="button" className="tour__off" onClick={turnOff}>
          다시 보지 않기
        </button>
      </div>
    </div>
  )
}
