
// Mock Recite Service

const MOCK_EVALUATION = {
  ok: true,
  ui: {
    score: 95,
    title: { name: '边塞小诗人', icon: '🏰' },
    details: [
      { label: '准确度', value: '100%', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
      { label: '流畅度', value: 'S级', color: 'text-[var(--app-primary)]', bg: 'bg-[var(--app-primary-soft-bg)]', border: 'border-[var(--app-primary-soft-border)]' },
      { label: '情感', value: '充沛', color: 'text-[var(--app-accent)]', bg: 'bg-[var(--app-accent-soft-bg)]', border: 'border-[var(--app-accent-soft-border)]' }
    ]
  },
  feedback: {
    comment: '读得非常棒！特别是“不破楼兰终不还”这一句，气势十足！',
    improvement: '继续保持这份自信，你的声音很有感染力！'
  },
  asr: {
    text: '青海长云暗雪山，孤城遥望玉门关。黄沙百战穿金甲，不破楼兰终不还。'
  }
};

export async function evaluateRecite({ itemId, recognizedText, durationSec, quality }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_EVALUATION;
}

export async function evaluateReciteAudio({ itemId, audioBlob, durationSec, quality, recognizedText }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return MOCK_EVALUATION;
}

export async function listReciteItems() {
  return [];
}
