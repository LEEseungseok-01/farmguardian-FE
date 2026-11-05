const MAX_SIDE = 1600

/** 폰 사진을 줄여 보낸다 (Vercel 요청 4.5MB 제한). 줄이지 못하면 원본을 그대로 돌려준다 */
export async function shrinkImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) return file
    // JPEG에는 투명이 없어 흰 바탕을 깐다. 없으면 투명한 곳이 검게 나와 글자를 읽기 어렵다
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'label.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
