export async function evaluateRecite({ itemId, recognizedText, durationSec, quality }) {
  const res = await fetch('/api/recite/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId,
      recognizedText,
      durationSec,
      quality: quality || null
    })
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) {
    const message = data?.error?.message || '评测服务暂时不可用'
    throw new Error(message)
  }
  return data
}

export async function evaluateReciteAudio({ itemId, audioBlob, durationSec, quality, recognizedText }) {
  const fd = new FormData()
  fd.append('itemId', String(itemId))
  if (Number.isFinite(Number(durationSec))) fd.append('durationSec', String(durationSec))
  if (quality) fd.append('quality', JSON.stringify(quality))
  if (recognizedText) fd.append('recognizedText', String(recognizedText))
  if (audioBlob) fd.append('audio', audioBlob, 'recite.webm')

  const res = await fetch('/api/recite/evaluate', { method: 'POST', body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) {
    const message = data?.error?.message || '评测服务暂时不可用'
    throw new Error(message)
  }
  return data
}

export async function listReciteItems() {
  const res = await fetch('/api/recite/items')
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) throw new Error('获取内容列表失败')
  return data.items || []
}
