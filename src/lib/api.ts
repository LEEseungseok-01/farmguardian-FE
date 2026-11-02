/** BE를 부른다. 실패하면 BE가 준 `{error: {message}}`의 message를 Error로 던진다 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
    })
  } catch {
    throw new Error('서버에 연결할 수 없어요')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error?.message ?? '요청에 실패했어요')
  return data as T
}
