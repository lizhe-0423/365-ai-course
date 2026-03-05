
// Mock AI Service
export const chatWithDeepSeek = async (messages, options = {}) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  
  // Simple keyword matching for demo purposes
  if (lastUserMessage.includes('你好') || lastUserMessage.includes('是谁')) {
    return '公子好，我是您的书童。今日我们要学习哪首诗呢？';
  }
  
  if (lastUserMessage.includes('背诵') || lastUserMessage.includes('怎么背')) {
    return '背诵这首诗，建议先从理解意象入手。比如“青海长云”和“雪山”，闭上眼想象一下那苍茫的边塞景色，自然就记住了。';
  }
  
  if (lastUserMessage.includes('意思') || lastUserMessage.includes('解释')) {
    return '这句诗描绘了边塞的壮阔景色。青海湖上空的浓云遮暗了连绵的雪山，战士们驻守孤城，遥望着远方的玉门关。';
  }

  return '公子所言甚是。这首诗意境开阔，情感悲壮，确实值得细细品味。我们可以试着多读几遍，体会其中的豪情壮志。';
};
