// 로그인 때 AppState가 저장해 둔 사용자 id. BE는 이 값을 X-User-Id 헤더로 받는다
const userId = () => {
  try {
    return JSON.parse(localStorage.getItem('fg.user') ?? 'null')?.id as number | undefined
  } catch {
    return undefined
  }
}

type ApiError = { message?: string; details?: { errors?: { msg?: string }[] } }

// 422는 겉 문구가 늘 「요청 값이 올바르지 않습니다」라서, 한글로 된 실제 이유가 있으면 그걸 보여 준다.
// FastAPI 기본 검증 문구(영어)는 사용자에게 보이지 않게 겉 문구를 쓴다
const errorText = (error?: ApiError) => {
  const reason = error?.details?.errors?.[0]?.msg?.replace(/^Value error, /, '')
  if (reason && /[가-힣]/.test(reason)) return reason
  return error?.message ?? '요청에 실패했어요'
}

// 개발 때는 비워 두고 Vite 프록시를 쓴다. 배포하면 백엔드 주소를 넣는다
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** BE를 부른다. 실패하면 BE가 준 오류 문구를 Error로 던진다 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(userId() ? { 'X-User-Id': String(userId()) } : {}),
      },
    })
  } catch {
    throw new Error('서버에 연결할 수 없어요')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(errorText(data?.error))
  return data as T
}
