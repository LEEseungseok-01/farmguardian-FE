// 받침에 맞는 조사를 붙인다. 예: josa('라이몬', '과', '와') → '라이몬과'
export function josa(word: string, withBatchim: string, withoutBatchim: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const has = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (has ? withBatchim : withoutBatchim)
}

export const eul = (w: string) => josa(w, '을', '를')
export const gwa = (w: string) => josa(w, '과', '와')
export const iga = (w: string) => josa(w, '이', '가')

/** 으로/로. ㄹ 받침 뒤에는 '로' */
export function ro(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const jong = code >= 0 && code <= 11171 ? code % 28 : 0
  return word + (jong === 0 || jong === 8 ? '로' : '으로')
}

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

/** 초성만 뽑는다. 예: '배추' → 'ㅂㅊ' */
export const initials = (s: string) =>
  [...s]
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00
      return c >= 0 && c <= 11171 ? CHO[Math.floor(c / 588)] : ch
    })
    .join('')

/** 글자 그대로 또는 초성으로 찾는다 (ㅂㅊ → 배추) */
export const matchKo = (target: string, query: string) => {
  const q = query.replace(/\s/g, '')
  if (!q) return true
  const t = target.replace(/\s/g, '')
  return t.includes(q) || initials(t).includes(q)
}
